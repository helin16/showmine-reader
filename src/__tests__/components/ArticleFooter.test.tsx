import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ArticleFooter from '@/components/Article/ArticleFooter';

vi.mock('@/components/Item/ItemListUnderCompany', () => ({
  default: ({ companyId }: any) => <div>items:{companyId}</div>
}));

const company = { id: 'c1', name: 'Acme' } as any;

const logoOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.logo-wrapper')!.style.backgroundImage;

describe('ArticleFooter', () => {
  test('renders nothing without a company', () => {
    const { container } = render(<ArticleFooter />);
    expect(container).toBeEmptyDOMElement();
  });

  test('shows the company and its items', () => {
    render(
      <ArticleFooter
        company={{ ...company, description: '<p>We <b>make</b> things</p>' }}
      />
    );
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('We make things')).toBeInTheDocument();
    expect(screen.getByText('items:c1')).toBeInTheDocument();
  });

  test('links the website and phone number', () => {
    render(
      <ArticleFooter
        company={{
          ...company,
          websiteUrl: ' https://acme.example ',
          contactNumber: ' 0400 '
        }}
      />
    );
    expect(screen.getByText('Web: https://acme.example')).toHaveAttribute(
      'href',
      'https://acme.example'
    );
    expect(screen.getByText('Tel: 0400')).toHaveAttribute('href', 'tel:0400');
  });

  test.each([
    ['missing', {}],
    ['blank', { websiteUrl: '  ', contactNumber: '  ' }]
  ])('hides the contact links when they are %s', (_name, extra) => {
    render(<ArticleFooter company={{ ...company, ...extra }} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('uses the company logo', () => {
    const { container } = render(
      <ArticleFooter
        company={{
          ...company,
          LogoAsset: { url: 'https://c.example/logo.png' }
        }}
      />
    );
    expect(logoOf(container)).toContain('https://c.example/logo.png');
  });

  test('falls back to the default logo', () => {
    const { container } = render(<ArticleFooter company={company} />);
    expect(logoOf(container)).toContain('/default.png');
  });
});
