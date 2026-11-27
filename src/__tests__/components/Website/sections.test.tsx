import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Site from '@/components/Website/Site';
import { prefersChinaMap } from '@/components/Website/sections';
import WebsiteService from '@/serivices/WebsiteService';
import { iWebsite, iWebsiteSection } from '@/types/iWebsite';

const site = (
  sections: iWebsiteSection[],
  extra: Partial<iWebsite> = {}
): iWebsite => ({
  version: 1,
  slug: 'shop',
  companyId: 'c',
  company: {
    name: 'Shop',
    phone: '0400 000 000',
    email: 'hi@shop.test',
    address: '1 Main St'
  },
  pages: [
    { slug: 'home', title: 'Home', sections },
    { slug: 'about', title: 'About', sections: [] }
  ],
  ...extra
});
const show = (
  sections: iWebsiteSection[],
  extra: Partial<iWebsite> = {},
  articles = {}
) => {
  const website = site(sections, extra);
  return render(
    <Site website={website} page={website.pages[0]} articles={articles} />
  );
};

describe('website sections', () => {
  test('hero with its heading, text, image and a link to another page', () => {
    const { container } = show([
      {
        id: 'h',
        type: 'hero',
        heading: 'Welcome',
        subheading: 'Hello',
        imageUrl: 'https://cdn.test/a.png',
        buttonText: 'About us',
        buttonUrl: '/about'
      }
    ]);
    expect(
      screen.getByRole('heading', { name: 'Welcome' })
    ).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About us' })).toHaveAttribute(
      'href',
      '/s/shop/about'
    );
    expect(
      container.querySelector('.site-hero')?.getAttribute('style')
    ).toContain('https://cdn.test/a.png');
  });

  test('hero without a usable link shows no button', () => {
    show([
      {
        id: 'h',
        type: 'hero',
        buttonText: 'Go',
        buttonUrl: 'javascript:alert(1)'
      }
    ]);
    expect(screen.queryByRole('link', { name: 'Go' })).toBeNull();
  });

  // specs/005-website-blocks, slice 88a
  test('hero with two buttons and a note, the second in its own style', () => {
    const { container } = show([
      {
        id: 'h',
        type: 'hero',
        buttonText: 'Start free',
        buttonUrl: 'https://admin.test/signup',
        button2Text: 'Login',
        button2Url: '/about',
        note: 'No credit card required.'
      }
    ]);
    const buttons = container.querySelector('.site-hero .site-buttons');
    expect(
      Array.from(buttons?.querySelectorAll('a') || []).map(a => [
        a.textContent,
        a.getAttribute('href'),
        a.className
      ])
    ).toStrictEqual([
      ['Start free', 'https://admin.test/signup', 'site-button'],
      ['Login', '/s/shop/about', 'site-button second']
    ]);
    expect(buttons?.querySelector('.site-note')?.textContent).toBe(
      'No credit card required.'
    );
  });

  test('a second button without a usable link, or without text, is not shown; nor are empty buttons', () => {
    const { container } = show([
      {
        id: 'a',
        type: 'hero',
        heading: 'A',
        button2Text: 'Go',
        button2Url: 'javascript:x'
      },
      { id: 'b', type: 'hero', heading: 'B', button2Url: '/about' },
      { id: 'c', type: 'hero', heading: 'C' }
    ]);
    expect(container.querySelectorAll('.site-buttons')).toHaveLength(0);
    expect(screen.queryByRole('link', { name: 'Go' })).toBeNull();
  });

  test('a hero with only a note shows the note', () => {
    show([{ id: 'n', type: 'hero', note: 'Free for ever' }]);
    expect(screen.getByText('Free for ever')).toHaveClass('site-note');
  });

  test('image beside text: the image, the heading, plain text and buttons, on the side asked for', () => {
    const { container } = show([
      {
        id: 's',
        type: 'split',
        heading: 'Manage your content',
        text: '<b>Line one</b>\nLine two',
        imageUrl: 'https://cdn.test/s.png',
        imageAlt: 'A phone',
        imageSide: 'right',
        buttonText: 'Start free',
        buttonUrl: '/about'
      },
      {
        id: 'l',
        type: 'split',
        heading: 'Left',
        imageUrl: 'https://cdn.test/l.png'
      }
    ]);
    const [right, left] = Array.from(container.querySelectorAll('.site-split'));
    expect(right).toHaveClass('site-split', 'image-right');
    expect(left).toHaveClass('site-split', 'image-left');
    expect(left).not.toHaveClass('image-right');
    expect(right.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.test/s.png'
    );
    expect(screen.getByAltText('A phone')).toBe(right.querySelector('img'));
    expect(left.querySelector('img')).toHaveAttribute('alt', '');
    const text = right.querySelector('.site-split-text');
    expect(text?.querySelector('h2')?.textContent).toBe('Manage your content');
    // Plain text: the tags show as written, nothing is bold.
    expect(text?.querySelector('p')?.textContent).toBe(
      '<b>Line one</b>\nLine two'
    );
    expect(right.querySelector('b')).toBeNull();
    expect(text?.querySelector('.site-buttons a')).toHaveAttribute(
      'href',
      '/s/shop/about'
    );
  });

  test('image beside text without its image address shows the text alone', () => {
    const { container } = show([
      { id: 's', type: 'split', heading: 'No picture' }
    ]);
    expect(container.querySelector('.site-split img')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'No picture' })
    ).toBeInTheDocument();
  });

  // specs/005-website-blocks, slice 88c
  test('pricing plans: name, price and period, features, a button, and a highlighted plan', () => {
    const { container } = show([
      {
        id: 'p',
        type: 'pricing',
        heading: 'Prices and plans',
        intro: 'Unbeatable',
        plans: [
          {
            name: 'Free',
            price: '$0',
            period: 'monthly',
            features: ['1 user', '', '  ', '<b>2G</b> storage'],
            buttonText: 'Start Free',
            buttonUrl: '/about'
          },
          {
            name: 'Starter',
            price: '$49',
            highlight: true,
            buttonText: 'Go',
            buttonUrl: 'javascript:x'
          },
          {
            name: 'Odd',
            price: 'POA',
            features: 'not a list',
            highlight: 'yes'
          },
          null
        ]
      }
    ]);
    const block = container.querySelector('.site-pricing') as HTMLElement;
    expect(block.querySelector('h2')?.textContent).toBe('Prices and plans');
    expect(block.querySelector('.site-cards-intro')?.textContent).toBe(
      'Unbeatable'
    );
    const plans = Array.from(block.querySelectorAll(':scope > ul > li'));
    expect(plans.map(p => p.className)).toStrictEqual([
      'site-plan',
      'site-plan highlight',
      'site-plan',
      'site-plan'
    ]);
    expect(plans[0].querySelector('h3')?.textContent).toBe('Free');
    expect(plans[0].querySelector('.site-price')?.textContent).toBe(
      '$0 monthly'
    );
    expect(plans[0].querySelector('.site-price strong')?.textContent).toBe(
      '$0'
    );
    // Empty lines are left out; text stays plain.
    expect(
      Array.from(plans[0].querySelectorAll('ul li')).map(li => li.textContent)
    ).toStrictEqual(['1 user', '<b>2G</b> storage']);
    expect(plans[0].querySelector('b')).toBeNull();
    expect(plans[0].querySelector('a.site-button')).toHaveAttribute(
      'href',
      '/s/shop/about'
    );
    // A link the site would not follow shows no button.
    expect(plans[1].querySelector('a')).toBeNull();
    expect(plans[1].querySelector('.site-price')?.textContent).toBe('$49');
    expect(plans[2].querySelector('ul')).toBeNull();
    expect(plans[3].querySelector('h3')).toBeNull();
  });

  test('pricing without plans shows its heading and no plans', () => {
    const { container } = show([
      { id: 'p', type: 'pricing', heading: 'Soon' },
      { id: 'q', type: 'pricing', plans: 'broken' }
    ]);
    const [a, b] = Array.from(container.querySelectorAll('.site-pricing'));
    expect(a.querySelector('h2')?.textContent).toBe('Soon');
    expect(a.querySelectorAll('li')).toHaveLength(0);
    expect(b.querySelectorAll('li')).toHaveLength(0);
  });

  test('a map block at its height, sandboxed; none without an https address', () => {
    const { container } = show([
      {
        id: 'm1',
        type: 'map',
        mapUrl: 'https://maps.test/embed',
        height: 'large'
      },
      { id: 'm2', type: 'map', mapUrl: 'https://maps.test/b', height: 'huge' },
      { id: 'm3', type: 'map', mapUrl: 'http://maps.test/c' },
      { id: 'm4', type: 'map' }
    ]);
    const blocks = Array.from(container.querySelectorAll('.site-map-block'));
    expect(blocks.map(b => b.className)).toStrictEqual([
      'site-map-block large',
      'site-map-block medium'
    ]);
    const frame = blocks[0].querySelector('iframe') as HTMLIFrameElement;
    expect(frame).toHaveAttribute('src', 'https://maps.test/embed');
    expect(frame).toHaveAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-popups'
    );
    expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(frame).toHaveAttribute('title', 'Map');
    expect(frame).toHaveClass('site-map');
  });

  // specs/007-website-hubspot-map
  describe('a map with a China link', () => {
    const GOOGLE = 'https://www.google.com/maps/embed?pb=x';
    const AMAP = 'https://uri.amap.com/marker?position=145.13,-37.89';
    const both: iWebsiteSection = {
      id: 'm',
      type: 'map',
      mapUrl: GOOGLE,
      chinaMapUrl: AMAP
    };
    const browser = (userAgent: string, timeZone: string) => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
      vi.spyOn(
        Intl.DateTimeFormat.prototype,
        'resolvedOptions'
      ).mockReturnValue({
        timeZone
      } as Intl.ResolvedDateTimeFormatOptions);
    };
    const frames = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('iframe')).map(f =>
        f.getAttribute('src')
      );
    const DESKTOP = 'Mozilla/5.0 (Macintosh) Chrome/140';
    const WECHAT = 'Mozilla/5.0 (iPhone) MicroMessenger/8.0.50';
    afterEach(() => vi.restoreAllMocks());

    test.each([
      ['WeChat abroad', WECHAT, 'Australia/Melbourne', true],
      ['a browser in Shanghai time', DESKTOP, 'Asia/Shanghai', true],
      ['a browser in Urumqi time', DESKTOP, 'Asia/Urumqi', true],
      ['an old name for China time', DESKTOP, 'PRC', true],
      ['a browser in Melbourne', DESKTOP, 'Australia/Melbourne', false],
      ['a browser in Hong Kong', DESKTOP, 'Asia/Hong_Kong', false],
      ['a browser in Taipei', DESKTOP, 'Asia/Taipei', false]
    ])('%s: China map %s', (_name, userAgent, timeZone, china) => {
      browser(userAgent, timeZone);
      expect(prefersChinaMap()).toBe(china);
      const { container } = show([both]);
      expect(frames(container)).toStrictEqual([china ? AMAP : GOOGLE]);
    });

    test('no time zone known: the main map', () => {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(DESKTOP);
      vi.spyOn(
        Intl.DateTimeFormat.prototype,
        'resolvedOptions'
      ).mockImplementation(() => {
        throw new Error('no Intl');
      });
      expect(prefersChinaMap()).toBe(false);
    });

    test('the switch shows the other map, and back', () => {
      browser(DESKTOP, 'Australia/Melbourne');
      const { container } = show([both]);
      const button = screen.getByRole('button', {
        name: 'Switch map 切换地图'
      });
      fireEvent.click(button);
      expect(frames(container)).toStrictEqual([AMAP]);
      fireEvent.click(button);
      expect(frames(container)).toStrictEqual([GOOGLE]);
      const frame = container.querySelector('iframe') as HTMLIFrameElement;
      expect(frame).toHaveAttribute(
        'sandbox',
        'allow-scripts allow-same-origin allow-popups'
      );
      expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    });

    test('the page from the server loads neither map: an empty box of the height until the browser picks', () => {
      const website = site([{ ...both, height: 'small' }]);
      const html = renderToString(
        <Site website={website} page={website.pages[0]} articles={{}} />
      );
      expect(html).not.toContain('<iframe');
      expect(html).toContain('class="site-map-block small"');
      expect(html).toContain('class="site-map" aria-hidden="true"');
      expect(html).not.toContain('Switch map');
    });

    test('with only the main link the map is as before, with no switch, also from the server', () => {
      const only: iWebsiteSection = { id: 'm', type: 'map', mapUrl: GOOGLE };
      const website = site([only]);
      expect(
        renderToString(
          <Site website={website} page={website.pages[0]} articles={{}} />
        )
      ).toContain(`<iframe class="site-map" src="${GOOGLE}"`);
      const { container } = show([only]);
      expect(frames(container)).toStrictEqual([GOOGLE]);
      expect(
        screen.queryByRole('button', { name: 'Switch map 切换地图' })
      ).toBeNull();
    });

    test.each([
      [
        'an http China link',
        { chinaMapUrl: 'http://uri.amap.com/x' },
        [GOOGLE]
      ],
      ['a China link with no main link', { mapUrl: undefined }, []]
    ])('%s is not used', (_name, extra, expected) => {
      browser(WECHAT, 'Asia/Shanghai');
      const { container } = show([{ ...both, ...extra }]);
      expect(frames(container)).toStrictEqual(expected);
      expect(
        screen.queryByRole('button', { name: 'Switch map 切换地图' })
      ).toBeNull();
    });
  });

  // specs/005-website-blocks, slice 88b
  test('card grid: heading, intro, and cards with image, title and text; a linked card is a link', () => {
    const { container } = show([
      {
        id: 'c',
        type: 'cards',
        heading: 'Perfect Integration',
        intro: 'Sync to many places',
        columns: '4',
        boxed: true,
        items: [
          {
            imageUrl: 'https://cdn.test/w.png',
            title: 'WeChat',
            text: '<i>Official</i>',
            link: '/about'
          },
          { title: 'Facebook', link: 'javascript:x' },
          { text: 'Only text' },
          'not a card'
        ]
      }
    ]);
    const cards = container.querySelector('.site-cards') as HTMLElement;
    expect(cards).toHaveClass('site-cards', 'columns-4', 'boxed');
    expect(cards.querySelector('h2')?.textContent).toBe('Perfect Integration');
    expect(cards.querySelector('.site-cards-intro')?.textContent).toBe(
      'Sync to many places'
    );
    const items = Array.from(cards.querySelectorAll('ul > li'));
    expect(items).toHaveLength(4);
    const first = items[0].querySelector('a.site-card') as HTMLElement;
    expect(first).toHaveAttribute('href', '/s/shop/about');
    expect(first.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.test/w.png'
    );
    expect(first.querySelector('img')).toHaveAttribute('alt', '');
    expect(first.querySelector('h3')?.textContent).toBe('WeChat');
    // Plain text.
    expect(first.querySelector('p')?.textContent).toBe('<i>Official</i>');
    expect(first.querySelector('i')).toBeNull();
    // A link the site would not follow leaves a plain card.
    expect(items[1].querySelector('a')).toBeNull();
    expect(items[1].querySelector('div.site-card h3')?.textContent).toBe(
      'Facebook'
    );
    expect(items[1].querySelector('img')).toBeNull();
    expect(items[2].querySelector('h3')).toBeNull();
    expect(items[2].querySelector('p')?.textContent).toBe('Only text');
  });

  test('card grid: 3 columns and no boxes unless asked; no cards, no trouble', () => {
    const { container } = show([
      { id: 'a', type: 'cards', items: [{ title: 'A' }] },
      {
        id: 'b',
        type: 'cards',
        columns: '9',
        boxed: 'yes',
        items: [{ title: 'B' }]
      },
      { id: 'c', type: 'cards', columns: '2' }
    ]);
    const [a, b, c] = Array.from(container.querySelectorAll('.site-cards'));
    expect(a.className).toBe('site-cards columns-3');
    expect(b.className).toBe('site-cards columns-3');
    expect(c.className).toBe('site-cards columns-2');
    expect(c.querySelectorAll('li')).toHaveLength(0);
    expect(a.querySelector('h2')).toBeNull();
    expect(a.querySelector('.site-cards-intro')).toBeNull();
  });

  test('text shows its HTML', () => {
    show([{ id: 't', type: 'text', html: '<p>Our <b>story</b></p>' }]);
    expect(screen.getByText('story').tagName).toBe('B');
  });

  test('image and gallery keep their alt text, and skip images without an address', () => {
    show([
      {
        id: 'i',
        type: 'image',
        url: 'https://cdn.test/i.png',
        alt: 'Shop front',
        caption: 'Our shop'
      },
      { id: 'n', type: 'image', alt: 'Missing' },
      {
        id: 'g',
        type: 'gallery',
        images: [
          { assetId: 'a', url: 'https://cdn.test/a.png', alt: 'A' },
          { assetId: 'b', alt: 'B' }
        ]
      }
    ]);
    expect(screen.getByAltText('Shop front')).toHaveAttribute(
      'src',
      'https://cdn.test/i.png'
    );
    expect(screen.getByText('Our shop')).toBeInTheDocument();
    expect(screen.queryByAltText('Missing')).toBeNull();
    expect(screen.getByAltText('A')).toBeInTheDocument();
    expect(screen.queryByAltText('B')).toBeNull();
  });

  test('contact shows the details it is set to show, and an https map', () => {
    show([
      {
        id: 'c',
        type: 'contact',
        showPhone: true,
        showEmail: true,
        mapUrl: 'https://maps.test/x'
      }
    ]);
    expect(screen.getByRole('link', { name: '0400 000 000' })).toHaveAttribute(
      'href',
      'tel:0400000000'
    );
    expect(screen.getByRole('link', { name: 'hi@shop.test' })).toHaveAttribute(
      'href',
      'mailto:hi@shop.test'
    );
    expect(screen.queryByText('1 Main St')).toBeNull();
    expect(screen.getByTitle('Map')).toHaveAttribute(
      'src',
      'https://maps.test/x'
    );
    expect(screen.getByTitle('Map')).toHaveAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-popups'
    );
  });

  test('contact shows no map for a link that is not https', () => {
    show([
      {
        id: 'c',
        type: 'contact',
        showAddress: true,
        mapUrl: 'http://maps.test/x'
      }
    ]);
    expect(screen.getByText('1 Main St')).toBeInTheDocument();
    expect(screen.queryByTitle('Map')).toBeNull();
  });

  test('articles link to the article pages, and show nothing without articles', () => {
    const { rerender } = show(
      [{ id: 'a', type: 'articles', count: 3 }],
      {},
      { a: [{ id: 'i1', title: 'Event' }] }
    );
    expect(screen.getByRole('link', { name: 'Event' })).toHaveAttribute(
      'href',
      '/item/i1'
    );
    const website = site([{ id: 'a', type: 'articles', count: 3 }]);
    rerender(<Site website={website} page={website.pages[0]} articles={{}} />);
    expect(screen.queryByRole('link', { name: 'Event' })).toBeNull();
  });

  test('an unknown section type is skipped', () => {
    const { container } = show([{ id: 'x', type: 'marquee' }]);
    expect(container.querySelector('.site-page')?.children).toHaveLength(0);
  });

  test('nav lists the pages and marks the current one; theme colour and font apply', () => {
    const { container } = show([], {
      theme: { primaryColor: '#123456', fontPair: 'classic' },
      company: { name: 'Shop', logoUrl: 'https://cdn.test/logo.png' }
    });
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/s/shop'
    );
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/s/shop/about'
    );
    const root = container.querySelector('.site') as HTMLElement;
    expect(root.className).toContain('site-font-classic');
    expect(root.style.getPropertyValue('--site-primary')).toBe('#123456');
  });

  test('an invalid theme falls back to the defaults', () => {
    const { container } = show([], {
      theme: { primaryColor: 'red;}', fontPair: 'comic' }
    });
    const root = container.querySelector('.site') as HTMLElement;
    expect(root.className).toContain('site-font-modern');
    expect(root.getAttribute('style')).toBeNull();
  });
});

describe('WebsiteService.getHref()', () => {
  test.each([
    ['/about', undefined, '/s/shop/about'],
    ['/about', 'tok', '/s/shop/about?preview=tok'],
    ['https://example.com', undefined, 'https://example.com'],
    ['http://example.com', undefined, 'http://example.com'],
    ['mailto:a@b.test', undefined, 'mailto:a@b.test'],
    ['tel:123', undefined, 'tel:123'],
    ['javascript:alert(1)', undefined, undefined],
    ['//evil.test', undefined, undefined],
    ['/../x', undefined, undefined],
    [undefined, undefined, undefined]
  ])('%s with preview %s gives %s', (link, preview, expected) => {
    expect(WebsiteService.getHref({ slug: 'shop' }, link, preview)).toBe(
      expected
    );
  });

  test('a template preview links inside /t/<id>', () => {
    const template = { slug: 'shop', basePath: '/t/shop' };
    expect(WebsiteService.getHref(template, '/about')).toBe('/t/shop/about');
    expect(WebsiteService.getHref(template, '/About')).toBeUndefined();
  });
});
