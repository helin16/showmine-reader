import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Nav from '@/components/Website/Nav';
import { iWebsite } from '@/types/iWebsite';

const website: iWebsite = {
  version: 1,
  slug: 'shop',
  companyId: 'c',
  company: { name: 'Shop' },
  pages: [
    { slug: 'home', title: 'Home', sections: [] },
    { slug: 'about', title: 'About', sections: [] }
  ]
} as iWebsite;

const show = () => {
  render(<Nav website={website} currentSlug={'about'} />);
  return screen.getByRole('button', { name: 'Menu' });
};
const nav = () => screen.getByRole('navigation', { name: 'Pages' });

// /website.css shows the button and folds the links below 1024 px (SMN-86); here, what it toggles.
describe('Website menu', () => {
  test('starts closed and names the list it opens', () => {
    const button = show();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'site-menu');
    expect(screen.getByRole('list')).toHaveAttribute('id', 'site-menu');
    expect(nav()).toHaveClass('site-nav');
    expect(nav()).not.toHaveClass('is-open');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('opens, then Close closes it', () => {
    fireEvent.click(show());
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveAttribute('aria-expanded', 'true');
    expect(nav()).toHaveClass('site-nav', 'is-open');
    fireEvent.click(close);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(nav()).not.toHaveClass('is-open');
  });

  test('Escape closes it; other keys do not', () => {
    fireEvent.click(show());
    fireEvent.keyDown(screen.getByRole('link', { name: 'Home' }), {
      key: 'Tab'
    });
    expect(nav()).toHaveClass('is-open');
    fireEvent.keyDown(screen.getByRole('link', { name: 'Home' }), {
      key: 'Escape'
    });
    expect(nav()).not.toHaveClass('is-open');
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
  });

  test('Escape does nothing while it is closed', () => {
    show();
    const home = screen.getByRole('link', { name: 'Home' });
    home.focus();
    fireEvent.keyDown(home, { key: 'Escape' });
    expect(home).toHaveFocus();
  });

  test('a page link closes it', () => {
    fireEvent.click(show());
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(nav()).not.toHaveClass('is-open');
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
  });
});

// The layout's header (showmine-admin specs/004, slice 4a).
describe('Website menu with a layout', () => {
  const withHeader = (header: object, logoUrl?: string) =>
    ({
      ...website,
      company: { name: 'Shop', logoUrl },
      layout: { header }
    }) as iWebsite;

  test('leaves hidden pages out and adds outside links after the pages', () => {
    render(
      <Nav
        website={withHeader({
          hiddenSlugs: ['about'],
          links: [
            { label: 'Start free', url: 'https://admin.test/signup' },
            { label: 'Bad', url: 'javascript:alert(1)' },
            { label: 'Home again', url: '/home' }
          ]
        })}
        currentSlug={'home'}
      />
    );
    const links = screen.getAllByRole('link');
    expect(links.map(link => link.textContent)).toStrictEqual([
      'Shop',
      'Home',
      'Start free',
      'Home again'
    ]);
    expect(links[2]).toHaveAttribute('href', 'https://admin.test/signup');
    expect(links[3]).toHaveAttribute('href', '/s/shop/home');
    expect(screen.queryByText('Bad')).toBeNull();
  });

  test('an outside link closes the menu', () => {
    render(
      <Nav
        website={withHeader({
          links: [{ label: 'Login', url: 'https://a.test' }]
        })}
        currentSlug={'home'}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('link', { name: 'Login' }));
    expect(nav()).not.toHaveClass('is-open');
  });

  test('hides the logo or the name; the link keeps the name', () => {
    const { container, unmount } = render(
      <Nav
        website={withHeader({ showLogo: false }, 'https://cdn.test/logo.png')}
        currentSlug={'home'}
      />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveTextContent(
      'Shop'
    );
    unmount();

    const shown = render(
      <Nav
        website={withHeader({ showName: false }, 'https://cdn.test/logo.png')}
        currentSlug={'home'}
      />
    );
    expect(shown.container.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.test/logo.png'
    );
    const name = screen.getByRole('link', { name: 'Shop' });
    expect(name).toHaveClass('site-name');
    expect(name).not.toHaveTextContent('Shop');
  });

  test('with no logo shown, the name is shown anyway', () => {
    render(
      <Nav
        website={withHeader(
          { showLogo: false, showName: false },
          'https://cdn.test/logo.png'
        )}
        currentSlug={'home'}
      />
    );
    const name = screen.getByRole('link', { name: 'Shop' });
    expect(name).toHaveTextContent('Shop');
    expect(name).not.toHaveAttribute('aria-label');
  });

  test('without a layout shows the logo, the name and every page', () => {
    const { container } = render(
      <Nav
        website={
          {
            ...website,
            company: { name: 'Shop', logoUrl: 'https://cdn.test/l.png' }
          } as iWebsite
        }
        currentSlug={'home'}
      />
    );
    expect(container.querySelector('img')).not.toBeNull();
    expect(
      screen.getAllByRole('link').map(link => link.textContent)
    ).toStrictEqual(['Shop', 'Home', 'About']);
  });
});
