import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Site, { getThemeStyle } from '@/components/Website/Site';
import { FOOTER_ICONS } from '@/components/Website/Footer';
import { iWebsite, iWebsiteLayout } from '@/types/iWebsite';

const site = (layout?: iWebsiteLayout | null, theme = {}): iWebsite => ({
  version: 1,
  slug: 'shop',
  companyId: 'c',
  company: { name: 'Shop' },
  theme,
  layout,
  pages: [
    { slug: 'home', title: 'Home', sections: [] },
    { slug: 'contact', title: 'Contact', sections: [] }
  ]
});
const show = (layout?: iWebsiteLayout | null, theme = {}) => {
  const website = site(layout, theme);
  return render(
    <Site website={website} page={website.pages[0]} articles={{}} />
  );
};

// The layout's footer and the theme additions (showmine-admin specs/004, slice 4a).
describe('Website footer', () => {
  test('shows the columns, their items and the copyright line', () => {
    show({
      footer: {
        columns: [
          { items: [{ type: 'text', text: 'Line one\nLine two' }] },
          {
            heading: 'Contact Info',
            items: [
              { type: 'contact', icon: 'address', text: '1 Main St' },
              { type: 'contact', icon: 'unknown', text: 'No icon' }
            ]
          },
          {
            heading: 'Support',
            items: [
              { type: 'button', label: 'Contact Us', url: '/contact' },
              { type: 'button', label: 'Bad', url: 'javascript:x' }
            ]
          },
          {
            heading: 'Licences',
            items: [
              {
                type: 'image',
                assetId: 'a',
                alt: 'QR',
                url: 'https://cdn.test/qr.png'
              },
              {
                type: 'image',
                assetId: 'b',
                alt: 'Licence',
                url: 'https://cdn.test/l.png',
                link: 'https://gov.test/l'
              },
              { type: 'image', assetId: 'gone', alt: 'Gone' }
            ]
          }
        ],
        copyright: '© Shop'
      }
    });
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('site-footer');
    const columns = footer.querySelectorAll(
      '.site-footer-columns > .site-footer-column'
    );
    expect(columns).toHaveLength(4);
    expect(
      within(footer)
        .getAllByRole('heading')
        .map(h => h.textContent)
    ).toStrictEqual(['Contact Info', 'Support', 'Licences']);
    expect(within(columns[0] as HTMLElement).getByText(/Line one/)).toHaveClass(
      'site-footer-text'
    );
    expect(columns[0].textContent).toBe('Line one\nLine two');

    const [address, noIcon] = Array.from(
      columns[1].querySelectorAll('.site-footer-contact')
    );
    expect(address.textContent).toBe('1 Main St');
    expect(address.querySelectorAll('svg path')).toHaveLength(
      FOOTER_ICONS.address.length
    );
    expect(address.querySelector('svg')).toHaveAttribute('aria-hidden');
    expect(noIcon.querySelector('svg')).toBeNull();

    const button = within(columns[2] as HTMLElement).getByRole('link', {
      name: 'Contact Us'
    });
    expect(button).toHaveClass('site-button');
    expect(button).toHaveAttribute('href', '/s/shop/contact');
    expect(within(columns[2] as HTMLElement).queryByText('Bad')).toBeNull();

    expect(
      within(columns[3] as HTMLElement)
        .getByAltText('QR')
        .closest('a')
    ).toBeNull();
    expect(
      within(columns[3] as HTMLElement)
        .getByAltText('QR')
        .closest('p')
    ).toHaveClass('site-footer-image');
    expect(
      within(columns[3] as HTMLElement).getByRole('link', { name: 'Licence' })
    ).toHaveAttribute('href', 'https://gov.test/l');
    expect(within(columns[3] as HTMLElement).queryByAltText('Gone')).toBeNull();

    expect(within(footer).getByText('© Shop')).toHaveClass('site-copyright');
  });

  test.each([[undefined], [null], [{ footer: null }], [{ header: {} }]])(
    'none for a layout of %p, as before',
    layout => {
      show(layout as iWebsiteLayout);
      expect(screen.queryByRole('contentinfo')).toBeNull();
    }
  );

  test('a footer without columns or copyright is still a footer', () => {
    const { container } = show({ footer: {} });
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(container.querySelector('.site-copyright')).toBeNull();
  });
});

describe('Website theme', () => {
  test('sets each colour and the width the API allows', () => {
    const theme = {
      primaryColor: '#111111',
      backgroundColor: '#e5eefe',
      headingColor: '#58468b',
      secondaryColor: '#ff9900',
      contentWidth: 1140
    };
    expect(getThemeStyle(theme)).toStrictEqual({
      '--site-primary': '#111111',
      '--site-bg': '#e5eefe',
      '--site-heading': '#58468b',
      '--site-secondary': '#ff9900',
      '--site-width': '1140px'
    });
    const { container } = show(null, theme);
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        '--site-bg'
      )
    ).toBe('#e5eefe');
  });

  test('leaves out anything else', () => {
    expect(
      getThemeStyle({
        primaryColor: 'red',
        backgroundColor: '#fff',
        headingColor: 'url(x)',
        contentWidth: 1000
      })
    ).toBeUndefined();
    expect(getThemeStyle({ contentWidth: 960 })).toStrictEqual({
      '--site-width': '960px'
    });
    expect(getThemeStyle(undefined)).toBeUndefined();
  });
});
