import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Site from '@/components/Website/Site';
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
    expect(WebsiteService.getHref('shop', link, preview)).toBe(expected);
  });
});
