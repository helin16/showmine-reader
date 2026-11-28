import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Site, { groupSideBySide } from '@/components/Website/Site';
import { iWebsite, iWebsiteSection } from '@/types/iWebsite';

// SMN-94 Reader: side-by-side rows, full width, dark text, China map picture, featured articles, form placeholders.
const site = (sections: iWebsiteSection[]): iWebsite => ({
  version: 1,
  slug: 'shop',
  companyId: 'c',
  company: { name: 'Shop' },
  pages: [{ slug: 'home', title: 'Home', sections }]
});
const show = (sections: iWebsiteSection[], articles = {}) => {
  const website = site(sections);
  return render(
    <Site website={website} page={website.pages[0]} articles={articles} />
  );
};
const text = (id: string, sideBySide?: boolean): iWebsiteSection => ({
  id,
  type: 'text',
  html: `<p>${id}</p>`,
  ...(sideBySide ? { sideBySide } : {})
});

describe('groupSideBySide()', () => {
  const ids = (sections: iWebsiteSection[]) =>
    groupSideBySide(sections).map(g => g.map(s => s.id));
  test('pairs, lone ones, and three in a row', () => {
    expect(ids([text('a', true), text('b', true)])).toStrictEqual([['a', 'b']]);
    expect(ids([text('a', true), text('b')])).toStrictEqual([['a'], ['b']]);
    expect(ids([text('a'), text('b', true), text('c')])).toStrictEqual([
      ['a'],
      ['b'],
      ['c']
    ]);
    expect(
      ids([text('a', true), text('b', true), text('c', true)])
    ).toStrictEqual([['a', 'b'], ['c']]);
    expect(
      ids([text('a', true), text('b', true), text('c', true), text('d', true)])
    ).toStrictEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
    expect(ids([])).toStrictEqual([]);
  });
  test('a pair renders in one site-row, a lone one as usual', () => {
    const { container } = show([
      text('a', true),
      text('b', true),
      text('c', true)
    ]);
    const main = container.querySelector('main') as HTMLElement;
    expect(main.children).toHaveLength(2);
    expect(main.children[0]).toHaveClass('site-row');
    expect(main.children[0].querySelectorAll(':scope > section')).toHaveLength(
      2
    );
    expect(main.children[1].tagName).toBe('SECTION');
  });

  test('shared blocks pair only among themselves, as the admin canvas draws them', () => {
    const website = {
      ...site([text('p1', true), text('p2', true)]),
      layout: { sharedAbove: [text('s1', true)], sharedBelow: [] }
    } as iWebsite;
    const { container } = render(
      <Site website={website} page={website.pages[0]} articles={{}} />
    );
    const main = container.querySelector('main') as HTMLElement;
    expect(main.children).toHaveLength(2);
    expect(main.children[0].tagName).toBe('SECTION');
    expect(main.children[1]).toHaveClass('site-row');
    expect(main.children[1].textContent).toBe('p1p2');
  });
});

describe('sites without the new fields', () => {
  test('render as before', () => {
    const { container } = show([
      {
        id: 'h',
        type: 'hero',
        heading: 'Hi',
        imageUrl: 'https://x.test/a.jpg'
      },
      { id: 'm', type: 'map', mapUrl: 'https://maps.test/a' },
      text('t')
    ]);
    expect(container.querySelector('.site-row')).toBeNull();
    expect(container.querySelector('.site-hero')?.className).toBe(
      'site-hero with-image'
    );
    expect(container.querySelector('.site-map-block')?.className).toBe(
      'site-map-block medium'
    );
  });
  test('articles without a layout keep the grid markup', () => {
    const { container } = show([{ id: 'a', type: 'articles', count: 2 }], {
      a: [
        { id: '1', title: 'One' },
        { id: '2', title: 'Two' }
      ]
    });
    expect(container.querySelector('.site-articles')?.className).toBe(
      'site-articles'
    );
    expect(container.querySelectorAll('.site-articles > ul > li')).toHaveLength(
      2
    );
    expect(container.querySelectorAll('.site-articles img')).toHaveLength(2);
  });
});

describe('hero and map options', () => {
  test('fullWidth and darkText add classes', () => {
    const { container } = show([
      {
        id: 'h',
        type: 'hero',
        imageUrl: 'https://x.test/a.jpg',
        fullWidth: true,
        darkText: true
      },
      { id: 'm', type: 'map', mapUrl: 'https://maps.test/a', fullWidth: true },
      { id: 'h2', type: 'hero', fullWidth: false, darkText: false }
    ]);
    const [hero, plain] = Array.from(container.querySelectorAll('.site-hero'));
    expect(hero.className).toBe('site-hero with-image site-full dark-text');
    expect(plain.className).toBe('site-hero');
    expect(container.querySelector('.site-map-block')?.className).toBe(
      'site-map-block medium site-full'
    );
  });
});

describe('a map with a picture for China', () => {
  const GOOGLE = 'https://www.google.com/maps/embed?pb=x';
  const PICTURE = 'https://x.test/map.png';
  const picture: iWebsiteSection = {
    id: 'm',
    type: 'map',
    mapUrl: GOOGLE,
    imageUrl: PICTURE,
    imageAlt: 'Our street'
  };
  const browser = (userAgent: string, timeZone: string) => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone
    } as Intl.ResolvedDateTimeFormatOptions);
  };
  const DESKTOP = 'Mozilla/5.0 (Macintosh) Chrome/140';
  const WECHAT = 'Mozilla/5.0 (iPhone) MicroMessenger/8.0.50';
  afterEach(() => vi.restoreAllMocks());

  test.each([
    ['WeChat', WECHAT, 'Australia/Melbourne', true],
    ['Shanghai time', DESKTOP, 'Asia/Shanghai', true],
    ['Melbourne', DESKTOP, 'Australia/Melbourne', false]
  ])('%s: picture %s', (_name, userAgent, timeZone, china) => {
    browser(userAgent, timeZone);
    const { container } = show([picture]);
    const img = container.querySelector('img.site-map.site-map-picture');
    expect(!!img).toBe(china);
    expect(container.querySelector('iframe')?.getAttribute('src') ?? null).toBe(
      china ? null : GOOGLE
    );
    if (img) {
      expect(img).toHaveAttribute('src', PICTURE);
      expect(img).toHaveAttribute('alt', 'Our street');
    }
  });

  test('the switch toggles between picture and map', () => {
    browser(WECHAT, 'Australia/Melbourne');
    const { container } = show([picture]);
    const button = screen.getByRole('button', { name: 'Switch map 切换地图' });
    expect(container.querySelector('.site-map-picture')).not.toBeNull();
    fireEvent.click(button);
    expect(container.querySelector('.site-map-picture')).toBeNull();
    expect(container.querySelector('iframe')).toHaveAttribute('src', GOOGLE);
    fireEvent.click(button);
    expect(container.querySelector('.site-map-picture')).not.toBeNull();
  });

  test('the server page shows the empty placeholder, no map, no picture', () => {
    const website = site([picture]);
    const html = renderToString(
      <Site website={website} page={website.pages[0]} articles={{}} />
    );
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<img');
    expect(html).toContain('class="site-map" aria-hidden="true"');
    expect(html).not.toContain('Switch map');
  });

  test('with a China link the picture is not used', () => {
    browser(WECHAT, 'Australia/Melbourne');
    const AMAP = 'https://uri.amap.com/marker?position=1,2';
    const { container } = show([{ ...picture, chinaMapUrl: AMAP }]);
    expect(container.querySelector('.site-map-picture')).toBeNull();
    expect(container.querySelector('iframe')).toHaveAttribute('src', AMAP);
  });
});

describe('featured articles', () => {
  test('first post large, the others as title links', () => {
    const { container } = show(
      [{ id: 'a', type: 'articles', layout: 'featured' }],
      {
        a: [
          { id: '1', title: 'One' },
          { id: '2', title: 'Two' },
          { id: '3', title: 'Three' }
        ]
      }
    );
    const root = container.querySelector('section') as HTMLElement;
    expect(root.className).toBe('site-articles featured');
    const first = root.querySelector('.site-featured-post') as HTMLElement;
    expect(first.querySelector('a')).toHaveAttribute('href', '/item/1');
    expect(first.querySelector('img')).not.toBeNull();
    expect(first.textContent).toBe('One');
    const rest = Array.from(root.querySelectorAll('ul a'));
    expect(rest.map(a => a.getAttribute('href'))).toStrictEqual([
      '/item/2',
      '/item/3'
    ]);
    expect(root.querySelectorAll('ul img')).toHaveLength(0);
  });
  test('one post has no list; none shows nothing', () => {
    const { container } = show(
      [{ id: 'a', type: 'articles', layout: 'featured' }],
      {
        a: [{ id: '1', title: 'One' }]
      }
    );
    expect(container.querySelector('.site-featured-post')).not.toBeNull();
    expect(container.querySelector('.site-articles ul')).toBeNull();
    const none = show([{ id: 'a', type: 'articles', layout: 'featured' }]);
    expect(none.container.querySelector('.site-articles')).toBeNull();
  });
});

describe('the message form', () => {
  test('inputs show their label and * as placeholder', () => {
    const { container } = show([{ id: 'f', type: 'form' }]);
    const placeholders = Array.from(
      container.querySelectorAll('.site-form-field input, textarea')
    ).map(e => e.getAttribute('placeholder'));
    expect(placeholders).toStrictEqual([
      'First name 名*',
      'Last name 姓*',
      'Email 邮箱*',
      'Message 留言*'
    ]);
  });
});
