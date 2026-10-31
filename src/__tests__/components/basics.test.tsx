import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import DefaultIcon, { defaultLogoUrl } from '@/components/DefaultIcon';
import Header from '@/components/Header';
import Logo from '@/components/Logo';
import Page from '@/components/Page';
import Page404 from '@/components/Page404';
import Spinner from '@/components/Spinner';

vi.mock('next/head', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Header', () => {
  const title = (container: HTMLElement) =>
    container.querySelector('title')?.textContent;
  const description = (container: HTMLElement) =>
    container.querySelector('meta[name="description"]')?.getAttribute('content');

  test('uses the given title and description', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'App');
    const { container } = render(<Header title={'Hi'} description={'Desc'} />);
    expect(title(container)).toBe('Hi');
    expect(description(container)).toBe('Desc');
  });

  test('falls back to the app name, with an empty description', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'App');
    const { container } = render(<Header />);
    expect(title(container)).toBe('App');
    expect(description(container)).toBe('');
  });

  test('falls back to SHM without an app name', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_NAME', undefined);
    const { container } = render(<Header />);
    expect(title(container)).toBe('SHM');
  });
});

describe('Logo', () => {
  test('defaults to 200 by 200', () => {
    render(<Logo />);
    const image = screen.getByAltText('logo');
    expect(image).toHaveAttribute('width', '200');
    expect(image).toHaveAttribute('height', '200');
    expect(image.getAttribute('src')).toContain('logo.png');
  });

  test('accepts a size and other image props', () => {
    render(<Logo width={40} height={30} className={'x'} />);
    const image = screen.getByAltText('logo');
    expect(image).toHaveAttribute('width', '40');
    expect(image).toHaveAttribute('height', '30');
    expect(image).toHaveClass('x');
  });
});

describe('DefaultIcon', () => {
  test('shows the default image', () => {
    render(<DefaultIcon width={10} height={10} />);
    const image = screen.getByAltText('default');
    expect(defaultLogoUrl).toBe('/default.png');
    expect(image.getAttribute('src')).toContain('default.png');
    expect(image).toHaveAttribute('width', '10');
  });
});

describe('Page', () => {
  test('renders the header, children and class name', () => {
    const { container } = render(
      <Page header={<div>head</div>} className={'x'}>
        body
      </Page>
    );
    expect(screen.getByText('head')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('body');
    expect(container.firstChild).toHaveClass('page-wrapper', 'x');
  });

  // Current behaviour, reported as a cosmetic bug: a missing className is
  // written out literally.
  test('adds the class "undefined" when no class name is given', () => {
    const { container } = render(<Page>body</Page>);
    expect(container.firstChild).toHaveClass('undefined');
    expect(screen.getByRole('main')).toHaveTextContent('body');
  });
});

describe('Page404', () => {
  test('has default wording and links to the marketing site', () => {
    vi.stubEnv('NEXT_PUBLIC_MARKETING_SITE_URL', 'https://site.example/');
    render(<Page404 />);
    expect(screen.getByRole('heading')).toHaveTextContent('404 走丢了');
    expect(screen.getByText(/can't find the page/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://site.example/'
    );
    expect(screen.getByAltText('logo')).toHaveAttribute('width', '120');
  });

  test('accepts a title and description', () => {
    render(<Page404 title={'Gone'} description={'Really gone'} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Gone');
    expect(screen.getByText('Really gone')).toBeInTheDocument();
    expect(screen.queryByText(/走丢了/)).not.toBeInTheDocument();
  });
});

describe('Spinner', () => {
  test('renders the spinner element', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass('spinner');
  });
});
