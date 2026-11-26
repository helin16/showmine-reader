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
