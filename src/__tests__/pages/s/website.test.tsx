import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import WebsitePage, { getServerSideProps } from '@/pages/s/[slug]/[[...page]]';
import WebsiteService from '@/serivices/WebsiteService';
import ItemService from '@/serivices/ItemService';
import { iWebsite } from '@/types/iWebsite';

vi.mock('@/serivices/WebsiteService', async importOriginal => {
  const actual: any = await importOriginal();
  return {
    default: {
      ...actual.default,
      getPublicWebsite: vi.fn(),
      countPageView: vi.fn()
    }
  };
});
vi.mock('@/serivices/ItemService', () => ({
  default: {
    getAllItemsUnderCompany: vi.fn(),
    getCoverImageUrl: () => 'cover.png'
  }
}));
vi.mock('@/components/Header', () => ({
  default: ({ title, description, image }: any) => (
    <div>
      meta:{title}|{description}|{image}
    </div>
  )
}));
vi.mock('@/components/Page404', () => ({
  default: ({ title }: any) => <div>not-found:{title || 'default'}</div>
}));
vi.mock('next/head', () => ({
  default: ({ children }: any) => <div data-testid={'head'}>{children}</div>
}));

const website = (extra: Partial<iWebsite> = {}): iWebsite => ({
  version: 1,
  slug: 'shop',
  companyId: 'company-1',
  company: { name: 'Shop', logoUrl: 'logo.png' },
  seo: { title: 'Shop site', description: 'Site words', imageUrl: 'site.png' },
  pages: [
    { slug: 'home', title: 'Home', sections: [] },
    {
      slug: 'news',
      title: 'News',
      seo: { title: 'Latest', description: 'Page words', imageUrl: 'page.png' },
      sections: [{ id: 's1', type: 'articles', count: 4, tagName: 'events' }]
    }
  ],
  ...extra
});

const run = async (
  slug: string,
  page?: string[],
  query: object = {},
  userAgent = 'Mozilla/5.0',
  method = 'GET'
) => {
  const res = { statusCode: 200, setHeader: vi.fn() };
  const result: any = await getServerSideProps({
    params: { slug, page },
    query,
    req: { method, headers: { 'user-agent': userAgent } },
    res
  });
  return { res, props: result.props };
};

describe('website page', () => {
  beforeEach(() => {
    vi.mocked(WebsiteService.getPublicWebsite).mockResolvedValue(website());
    vi.mocked(WebsiteService.countPageView).mockReset();
    vi.mocked(WebsiteService.countPageView).mockResolvedValue({} as any);
    vi.mocked(ItemService.getAllItemsUnderCompany).mockResolvedValue({
      data: [{ id: 'i1', title: 'Event' }]
    } as any);
  });

  describe('getServerSideProps()', () => {
    test('shows the first page at /s/<slug>', async () => {
      const { props, res } = await run('shop');
      expect(WebsiteService.getPublicWebsite).toHaveBeenCalledWith(
        'shop',
        undefined
      );
      expect(props.page.slug).toBe('home');
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(ItemService.getAllItemsUnderCompany).not.toHaveBeenCalled();
    });

    test('shows a named page, with its articles loaded on the server', async () => {
      const { props } = await run('shop', ['news']);
      expect(props.page.slug).toBe('news');
      expect(props.articles).toStrictEqual({
        s1: [{ id: 'i1', title: 'Event' }]
      });
      expect(ItemService.getAllItemsUnderCompany).toHaveBeenCalledWith(
        'company-1',
        expect.objectContaining({
          perPage: 4,
          sort: 'publishedAt:DESC',
          tagNames: 'events'
        })
      );
    });

    test('loads the articles of shared blocks too', async () => {
      vi.mocked(WebsiteService.getPublicWebsite).mockResolvedValue(
        website({
          layout: {
            sharedBelow: [{ id: 'shared', type: 'articles', count: 3 }]
          }
        }) as any
      );
      const { props } = await run('shop', ['news']);
      expect(Object.keys(props.articles)).toStrictEqual(['s1', 'shared']);
      expect(ItemService.getAllItemsUnderCompany).toHaveBeenCalledTimes(2);
    });

    test('loads articles blocks inside rows, and leaves out shared blocks hidden on the page', async () => {
      vi.mocked(WebsiteService.getPublicWebsite).mockResolvedValue(
        website({
          layout: {
            sharedBelow: [
              {
                id: 'gone',
                type: 'articles',
                count: 3,
                hiddenSlugs: ['news']
              }
            ]
          },
          pages: [
            {
              slug: 'news',
              title: 'News',
              sections: [
                {
                  id: 'row',
                  type: 'row',
                  blocks: [
                    { id: 'a1', type: 'articles', count: 3 },
                    {
                      id: 'inner',
                      type: 'row',
                      blocks: [{ id: 'a2', type: 'articles', count: 3 }]
                    }
                  ]
                }
              ]
            }
          ]
        }) as any
      );
      const { props } = await run('shop');
      expect(Object.keys(props.articles)).toStrictEqual(['a1', 'a2']);
    });

    test('leaves an articles section empty when its articles fail to load', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.mocked(ItemService.getAllItemsUnderCompany).mockRejectedValue(
        new Error('down')
      );
      const { props } = await run('shop', ['news']);
      expect(props.articles).toStrictEqual({ s1: [] });
    });

    test('gives not-found for an unknown page', async () => {
      const { props, res } = await run('shop', ['missing']);
      expect(props).toStrictEqual({});
      expect(res.statusCode).toBe(404);
    });

    test.each([
      ['404', { response: { status: 404 } }],
      ['500', { response: { status: 500 } }],
      ['a network failure', {}]
    ])('gives not-found when the API answers %s', async (_, extra) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.mocked(WebsiteService.getPublicWebsite).mockRejectedValue(
        Object.assign(new Error('x'), extra)
      );
      const { props, res } = await run('shop');
      expect(props).toStrictEqual({});
      expect(res.statusCode).toBe(404);
    });

    test('says too many requests on 429', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.mocked(WebsiteService.getPublicWebsite).mockRejectedValue(
        Object.assign(new Error('x'), { response: { status: 429 } })
      );
      const { props, res } = await run('shop');
      expect(props).toStrictEqual({ isRateLimited: true });
      expect(res.statusCode).toBe(429);
    });

    test('a preview is not cached, indexed or sent on as a referrer', async () => {
      const { props, res } = await run('shop', undefined, { preview: 'abc' });
      expect(WebsiteService.getPublicWebsite).toHaveBeenCalledWith(
        'shop',
        'abc'
      );
      expect(props.preview).toBe('abc');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(res.setHeader).toHaveBeenCalledWith('X-Robots-Tag', 'noindex');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'no-referrer'
      );
    });
  });

  // US7 (T069): one view per published page shown, counted from the server.
  describe('page views', () => {
    test('a published page counts one view, the home page by its own name', async () => {
      await run('shop');
      await run('shop', ['news']);
      expect(vi.mocked(WebsiteService.countPageView).mock.calls).toStrictEqual([
        ['shop', 'home'],
        ['shop', 'news']
      ]);
    });

    test.each([
      ['a preview', () => run('shop', undefined, { preview: 'abc' })],
      [
        'a copy the API marks as a preview',
        () => {
          vi.mocked(WebsiteService.getPublicWebsite).mockResolvedValue(
            website({ isPreview: true })
          );
          return run('shop');
        }
      ],
      [
        "ShowMine's automated checks",
        () => run('shop', undefined, {}, 'ShowMine-E2E')
      ],
      ['a HEAD request', () => run('shop', undefined, {}, undefined, 'HEAD')],
      ['an unknown page', () => run('shop', ['missing'])],
      [
        'a website that fails to load',
        () => {
          vi.spyOn(console, 'error').mockImplementation(() => undefined);
          vi.mocked(WebsiteService.getPublicWebsite).mockRejectedValue(
            new Error('x')
          );
          return run('shop');
        }
      ]
    ])('%s is not counted', async (_, show) => {
      await show();
      expect(WebsiteService.countPageView).not.toHaveBeenCalled();
    });

    test('a view that fails to count still shows the page, logging only the message', async () => {
      const error = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      vi.mocked(WebsiteService.countPageView).mockRejectedValue(
        Object.assign(new Error('timeout of 1000ms exceeded'), {
          config: { headers: { 'X-SHM-SERVER-KEY': 'secret' } }
        })
      );
      const { props, res } = await run('shop', ['news']);
      expect(props.page.slug).toBe('news');
      expect(props.articles).toStrictEqual({
        s1: [{ id: 'i1', title: 'Event' }]
      });
      expect(res.statusCode).toBe(200);
      expect(error).toHaveBeenCalledWith('timeout of 1000ms exceeded');
    });

    test('works without a request, as when Next gives none', async () => {
      const result: any = await getServerSideProps({
        params: { slug: 'shop' },
        query: {},
        res: { statusCode: 200, setHeader: vi.fn() }
      });
      expect(result.props.page.slug).toBe('home');
      expect(WebsiteService.countPageView).toHaveBeenCalledWith('shop', 'home');
    });
  });

  describe('page', () => {
    test('a published page has no preview label and can be indexed', async () => {
      const { props } = await run('shop');
      render(<WebsitePage {...props} />);
      expect(screen.queryByText('Preview 预览')).toBeNull();
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    });

    test('takes meta from the page first', async () => {
      const { props } = await run('shop', ['news']);
      render(<WebsitePage {...props} />);
      expect(
        screen.getByText('meta:Latest | Shop|Page words|page.png')
      ).toBeInTheDocument();
    });

    test('falls back to the site, then the company', async () => {
      // As the browser gets them: parsed from JSON, so the page is not the same object as pages[0].
      const props = JSON.parse(JSON.stringify((await run('shop')).props));
      render(<WebsitePage {...props} />);
      expect(
        screen.getByText('meta:Shop site | Shop|Site words|site.png')
      ).toBeInTheDocument();

      vi.mocked(WebsiteService.getPublicWebsite).mockResolvedValue(
        website({ seo: {} })
      );
      const bare = await run('shop');
      render(<WebsitePage {...bare.props} />);
      expect(
        screen.getByText('meta:Home | Shop||logo.png')
      ).toBeInTheDocument();
    });

    test('a preview carries noindex and keeps the token in its links', async () => {
      const { props } = await run('shop', undefined, { preview: 'abc' });
      render(<WebsitePage {...props} />);
      // React hoists <meta> into the document head.
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex'
      );
      expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute(
        'href',
        '/s/shop/news?preview=abc'
      );
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'href',
        '/s/shop?preview=abc'
      );
    });

    test('shows not-found, or too many requests', () => {
      const { rerender } = render(<WebsitePage />);
      expect(screen.getByText('not-found:default')).toBeInTheDocument();
      rerender(<WebsitePage isRateLimited />);
      expect(screen.getByText(/Too Many Requests/)).toBeInTheDocument();
    });
  });
});
