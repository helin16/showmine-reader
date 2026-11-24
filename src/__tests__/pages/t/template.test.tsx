import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import TemplatePage, { getServerSideProps } from '@/pages/t/[id]/[[...page]]';
import WebsiteService from '@/serivices/WebsiteService';
import ItemService from '@/serivices/ItemService';

// The template preview at /t/<id> (showmine-admin specs/001-website-builder, US4, T049).
vi.mock('@/serivices/WebsiteService', async importOriginal => {
  const actual: any = await importOriginal();
  return { default: { ...actual.default, getPublicTemplate: vi.fn() } };
});
vi.mock('@/serivices/ItemService', () => ({
  default: { getAllItemsUnderCompany: vi.fn(), getCoverImageUrl: () => '' }
}));
vi.mock('@/components/Header', () => ({
  default: ({ title }: any) => <div>meta:{title}</div>
}));
vi.mock('@/components/Page404', () => ({
  default: ({ title }: any) => <div>not-found:{title || 'default'}</div>
}));
vi.mock('next/head', () => ({
  default: ({ children }: any) => <div data-testid={'head'}>{children}</div>
}));

const template = () => ({
  template: { id: 'shop', theme: { primaryColor: '#b5542d' } },
  company: {
    name: 'Corner Pantry',
    phone: '03 9000 0000',
    email: 'hello@example.com',
    address: '12 Example Street'
  },
  pages: [
    {
      slug: 'home',
      title: 'Home',
      seo: {},
      sections: [
        {
          id: 'h',
          type: 'hero',
          heading: 'Fresh food',
          buttonText: 'Products',
          buttonUrl: '/products'
        },
        { id: 'a', type: 'articles', count: 3 }
      ]
    },
    {
      slug: 'products',
      title: 'Products',
      seo: {},
      sections: [{ id: 'c', type: 'contact', showPhone: true, showEmail: true }]
    }
  ]
});

const run = async (id: string, page?: string[]) => {
  const res = { statusCode: 200, setHeader: vi.fn() };
  const result: any = await getServerSideProps({ params: { id, page }, res });
  return { res, props: result.props };
};

describe('template preview page', () => {
  beforeEach(() => {
    vi.mocked(WebsiteService.getPublicTemplate).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  test('the home page, with links inside /t/<id>, never indexed or cached', async () => {
    vi.mocked(WebsiteService.getPublicTemplate).mockResolvedValue(
      template() as any
    );

    const { res, props } = await run('shop');
    render(<TemplatePage {...props} />);

    expect(WebsiteService.getPublicTemplate).toHaveBeenCalledWith('shop');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.setHeader).toHaveBeenCalledWith('X-Robots-Tag', 'noindex');
    expect(screen.getByText('Fresh food')).toBeTruthy();
    expect(screen.getByText('Preview 预览')).toBeTruthy();
    // React 19 moves <meta> into the document head.
    expect(document.head.querySelector('meta[name="robots"]')).toBeTruthy();
    const hrefs = Array.from(document.querySelectorAll('a')).map(a =>
      a.getAttribute('href')
    );
    expect(hrefs).toContain('/t/shop');
    expect(hrefs).toContain('/t/shop/products');
    expect(hrefs.some(href => `${href}`.startsWith('/s/'))).toBe(false);
    // No company, so the articles section loads nothing.
    expect(ItemService.getAllItemsUnderCompany).not.toHaveBeenCalled();
  });

  test('another page shows the sample contact details', async () => {
    vi.mocked(WebsiteService.getPublicTemplate).mockResolvedValue(
      template() as any
    );

    const { props } = await run('shop', ['products']);
    render(<TemplatePage {...props} />);

    expect(screen.getByText('03 9000 0000')).toBeTruthy();
    expect(screen.getByText('hello@example.com')).toBeTruthy();
    expect(screen.getByText('meta:Products | Corner Pantry')).toBeTruthy();
  });

  test('404 for a page the template does not have', async () => {
    vi.mocked(WebsiteService.getPublicTemplate).mockResolvedValue(
      template() as any
    );

    const { res, props } = await run('shop', ['nope']);
    render(<TemplatePage {...props} />);

    expect(res.statusCode).toBe(404);
    expect(screen.getByText('not-found:default')).toBeTruthy();
  });

  test.each([
    ['API 404', { message: 'nf', response: { status: 404 } }],
    ['API 500', { message: 'boom', response: { status: 500 } }],
    ['network failure', { message: 'ECONNREFUSED' }]
  ])('%s shows not-found', async (_, error) => {
    vi.mocked(WebsiteService.getPublicTemplate).mockRejectedValue(error);

    const { res, props } = await run('shop');
    render(<TemplatePage {...props} />);

    expect(res.statusCode).toBe(404);
    expect(screen.getByText('not-found:default')).toBeTruthy();
  });

  test('429 shows the rate-limit page', async () => {
    vi.mocked(WebsiteService.getPublicTemplate).mockRejectedValue({
      message: 'slow down',
      response: { status: 429 }
    });

    const { res, props } = await run('shop');
    render(<TemplatePage {...props} />);

    expect(res.statusCode).toBe(429);
    expect(screen.getByText(/Too Many Requests/)).toBeTruthy();
  });
});
