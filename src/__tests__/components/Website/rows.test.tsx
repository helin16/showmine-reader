import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Site, { getSections } from '@/components/Website/Site';
import { iWebsite, iWebsiteSection } from '@/types/iWebsite';

// SMN-95 shared blocks per page, SMN-96 row, buttons and tile blocks.
const site = (
  sections: iWebsiteSection[],
  extra: Partial<iWebsite> = {}
): iWebsite => ({
  version: 1,
  slug: 'shop',
  companyId: 'c',
  company: { name: 'Shop' },
  pages: [
    { slug: 'home', title: 'Home', sections },
    { slug: 'contact', title: 'Contact', sections: [] }
  ],
  ...extra
});
const show = (
  sections: iWebsiteSection[],
  extra: Partial<iWebsite> = {},
  articles = {},
  pageIndex = 0
) => {
  const website = site(sections, extra);
  return render(
    <Site
      website={website}
      page={website.pages[pageIndex]}
      articles={articles}
    />
  );
};
const text = (id: string, html = id): iWebsiteSection => ({
  id,
  type: 'text',
  html: `<p>${html}</p>`
});

describe('row', () => {
  test('defaults: boxed, medium, row, start, stretch, medium, wraps, no style', () => {
    const { container } = show([{ id: 'r', type: 'row', blocks: [text('a')] }]);
    const row = container.querySelector('.site-page > section')!;
    expect(row.className).toBe('site-flex site-flex-boxed site-pad-medium');
    expect(row.getAttribute('style')).toBeNull();
    const inner = row.firstElementChild!;
    expect(inner.className).toBe(
      'site-flex-inner site-dir-row site-justify-start site-align-stretch site-gap-medium'
    );
    const item = inner.firstElementChild!;
    expect(item.className).toBe('site-flex-item');
    expect(item.querySelector('.site-text')).not.toBeNull();
  });

  test('every option shows as a class, the background as a variable', () => {
    const { container } = show([
      {
        id: 'r',
        type: 'row',
        width: 'full',
        background: '#e8f4fd',
        padding: 'large',
        direction: 'column',
        wrap: false,
        justify: 'space-between',
        align: 'center',
        gap: 'none',
        blocks: [text('a')]
      }
    ]);
    const row = container.querySelector('.site-flex')!;
    expect(row.className).toBe('site-flex site-flex-full site-pad-large');
    expect(row.getAttribute('style')).toContain('--flex-bg: #e8f4fd');
    expect(row.firstElementChild!.className).toBe(
      'site-flex-inner site-dir-column site-justify-space-between site-align-center site-gap-none site-nowrap'
    );
  });

  test('a background that is not a colour, or an unknown option, is ignored', () => {
    const { container } = show([
      {
        id: 'r',
        type: 'row',
        background: 'red; x',
        padding: 'huge',
        blocks: [text('a')]
      }
    ]);
    const row = container.querySelector('.site-flex')!;
    expect(row.getAttribute('style')).toBeNull();
    expect(row.className).toContain('site-pad-medium');
  });

  test('basis classes with a dash; auto, absent and unknown give none', () => {
    const { container } = show([
      {
        id: 'r',
        type: 'row',
        blocks: [
          { ...text('a'), basis: '1/3' },
          { ...text('b'), basis: '3/5' },
          { ...text('c'), basis: 'full' },
          { ...text('d'), basis: 'auto' },
          { ...text('e'), basis: '7/9' },
          text('f')
        ]
      }
    ]);
    expect(
      Array.from(container.querySelectorAll('.site-flex-item')).map(
        i => i.className
      )
    ).toStrictEqual([
      'site-flex-item site-basis-1-3',
      'site-flex-item site-basis-3-5',
      'site-flex-item site-basis-full',
      'site-flex-item',
      'site-flex-item',
      'site-flex-item'
    ]);
  });

  test('a row inside a row draws its blocks too; an unknown block is skipped', () => {
    const { container } = show([
      {
        id: 'r',
        type: 'row',
        blocks: [
          { id: 'x', type: 'marquee' },
          {
            id: 'in',
            type: 'row',
            basis: '2/5',
            direction: 'column',
            blocks: [text('Inner text')]
          }
        ]
      }
    ]);
    const outer = container.querySelector('.site-flex')!;
    expect(
      outer.querySelectorAll(':scope > .site-flex-inner > .site-flex-item')
    ).toHaveLength(1);
    const inner = outer.querySelector('.site-flex-item > .site-flex')!;
    expect(inner.querySelector('.site-dir-column')).not.toBeNull();
    expect(screen.getByText('Inner text')).toBeInTheDocument();
  });

  test('a blocks list that is not a list draws an empty row', () => {
    const { container } = show([{ id: 'r', type: 'row', blocks: 'x' }]);
    expect(container.querySelectorAll('.site-flex-item')).toHaveLength(0);
  });

  test('articles inside a row, and inside a row in a row, get their items', () => {
    show(
      [
        {
          id: 'r',
          type: 'row',
          blocks: [
            { id: 'a1', type: 'articles', count: 3 },
            {
              id: 'in',
              type: 'row',
              blocks: [{ id: 'a2', type: 'articles', count: 3 }]
            }
          ]
        }
      ],
      {},
      { a1: [{ id: 'i1', title: 'One' }], a2: [{ id: 'i2', title: 'Two' }] }
    );
    expect(screen.getByRole('link', { name: 'One' })).toHaveAttribute(
      'href',
      '/item/i1'
    );
    expect(screen.getByRole('link', { name: 'Two' })).toHaveAttribute(
      'href',
      '/item/i2'
    );
  });

  test('a form inside a row gets the page it is on', () => {
    const { container } = show([
      {
        id: 'r',
        type: 'row',
        blocks: [{ id: 'f', type: 'form', heading: 'Write to us' }]
      }
    ]);
    expect(screen.getByText('Write to us')).toBeInTheDocument();
    expect(
      container.querySelector('.site-flex-item .site-form')
    ).not.toBeNull();
  });
});

describe('buttons block', () => {
  test('the existing buttons in a wrapper', () => {
    const { container } = show([
      {
        id: 'b',
        type: 'buttons',
        buttonText: 'Start',
        buttonUrl: 'https://admin.test/signup',
        button2Text: 'Login',
        button2Url: '/contact',
        note: 'No card needed'
      }
    ]);
    const block = container.querySelector('.site-page > .site-buttons-block')!;
    expect(
      Array.from(block.querySelectorAll('a')).map(a => [
        a.className,
        a.getAttribute('href')
      ])
    ).toStrictEqual([
      ['site-button', 'https://admin.test/signup'],
      ['site-button second', '/s/shop/contact']
    ]);
    expect(block.querySelector('.site-note')?.textContent).toBe(
      'No card needed'
    );
  });

  test('a buttons block with nothing shows an empty wrapper only', () => {
    const { container } = show([{ id: 'b', type: 'buttons' }]);
    expect(container.querySelector('.site-buttons')).toBeNull();
  });
});

describe('tile block', () => {
  test('icon, title and text in a section', () => {
    const { container } = show([
      {
        id: 't',
        type: 'tile',
        imageUrl: 'https://cdn.test/i.png',
        imageAlt: 'Icon',
        title: 'Fast',
        text: 'Very fast'
      }
    ]);
    const tile = container.querySelector('section.site-tile')!;
    const img = tile.querySelector('img.site-tile-icon')!;
    expect(img.getAttribute('src')).toBe('https://cdn.test/i.png');
    expect(img.getAttribute('alt')).toBe('Icon');
    expect(
      tile.querySelector('.site-tile-body h3.site-tile-title')?.textContent
    ).toBe('Fast');
    expect(
      tile.querySelector('.site-tile-body p.site-tile-text')?.textContent
    ).toBe('Very fast');
  });

  test('without an image or a link: no icon and a section, not an anchor', () => {
    const { container } = show([{ id: 't', type: 'tile', title: 'Plain' }]);
    expect(container.querySelector('.site-tile-icon')).toBeNull();
    expect(container.querySelector('a.site-tile')).toBeNull();
    expect(container.querySelector('.site-tile-text')).toBeNull();
  });

  test('with a link the whole tile is an anchor; an unusable link gives a section', () => {
    const { container } = show([
      { id: 't', type: 'tile', title: 'Go', link: '/contact' },
      { id: 'u', type: 'tile', title: 'Bad', link: 'javascript:alert(1)' }
    ]);
    const tiles = container.querySelectorAll('.site-tile');
    expect(tiles[0].tagName).toBe('A');
    expect(tiles[0].getAttribute('href')).toBe('/s/shop/contact');
    expect(tiles[1].tagName).toBe('SECTION');
  });
});

describe('shared blocks hidden on pages (SMN-95)', () => {
  const layout = {
    sharedAbove: [text('top')],
    sharedBelow: [
      text('Signup Today'),
      { ...text('Other'), hiddenSlugs: ['home'] },
      { ...text('Gone from none'), hiddenSlugs: ['pricing'] }
    ].map((b, i) => (i === 0 ? { ...b, hiddenSlugs: ['contact'] } : b))
  };

  test('getSections leaves a shared block out on the page it names only', () => {
    const website = site([text('own')], { layout });
    const ids = (index: number) =>
      getSections(website, website.pages[index]).map(s => s.id);
    expect(ids(0)).toStrictEqual([
      'top',
      'own',
      'Signup Today',
      'Gone from none'
    ]);
    expect(ids(1)).toStrictEqual(['top', 'Other', 'Gone from none']);
  });

  test('Site draws the same', () => {
    show([text('own')], { layout }, {}, 1);
    expect(screen.queryByText('Signup Today')).toBeNull();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  test('on the other page the block shows', () => {
    show([text('own')], { layout }, {}, 0);
    expect(screen.getByText('Signup Today')).toBeInTheDocument();
    expect(screen.queryByText('Other')).toBeNull();
  });

  test('a page block with hiddenSlugs is not hidden', () => {
    show([{ ...text('own'), hiddenSlugs: ['home'] }]);
    expect(screen.getByText('own')).toBeInTheDocument();
  });
});
