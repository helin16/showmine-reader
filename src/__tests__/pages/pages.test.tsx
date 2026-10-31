import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import App from '@/pages/_app';
import Document from '@/pages/_document';
import HomePage from '@/pages/index';

// The installed sass is too old for Vite's scss compiler, and styles are not
// under test here.
vi.mock('@/styles/globals.scss', () => ({}));
vi.mock('@/styles/article.scss', () => ({}));
vi.mock('@/styles/spinner.scss', () => ({}));
vi.mock('@/styles/itemList.scss', () => ({}));
vi.mock('@/styles/gTranslate.scss', () => ({}));
vi.mock('next/head', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));
vi.mock('next/document', () => ({
  Html: ({ children, lang }: any) => <html lang={lang}>{children}</html>,
  Head: () => <head />,
  Main: () => <main />,
  NextScript: () => <script />
}));

describe('app shell', () => {
  test('_app renders the page with its props', () => {
    const Component = ({ name }: any) => <div>page:{name}</div>;
    render(
      <App
        Component={Component}
        pageProps={{ name: 'a' }}
        router={{} as any}
      />
    );
    expect(screen.getByText('page:a')).toBeInTheDocument();
  });

  test('_document lays out the page in English', () => {
    expect(renderToStaticMarkup(<Document />)).toBe(
      '<html lang="en"><head></head><body><main></main><script></script></body></html>'
    );
  });

  test('the home page is the not found page', () => {
    const { container } = render(<HomePage />);
    expect(screen.getByRole('heading')).toHaveTextContent('404');
    expect(container.firstChild).toHaveClass('home-page-wrapper');
    expect(container.querySelector('title')).toHaveTextContent('SHM');
  });
});
