import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Redirect, { getServerSideProps } from '@/pages/redirect';

describe('redirect page', () => {
  test('shows the not found page when there is nothing to redirect to', () => {
    const { container } = render(<Redirect />);
    expect(screen.getByRole('heading')).toHaveTextContent('404');
    expect(container.firstChild).toHaveClass('home-page-wrapper');
  });

  test.each([[undefined], [''], ['   ']])(
    'stays on the page for itemId %p',
    async itemId => {
      expect(await getServerSideProps({ query: { itemId } })).toStrictEqual({
        props: {}
      });
    }
  );

  test('redirects to the item', async () => {
    expect(await getServerSideProps({ query: { itemId: 'abc' } })).toStrictEqual({
      redirect: { destination: '/item/abc', permanent: false }
    });
  });

  test.each([
    ['https://evil.example'],
    ['//evil.example'],
    ['../../evil'],
    ['a?b=c#d']
  ])('keeps %s inside the item route', async itemId => {
    const result: any = await getServerSideProps({ query: { itemId } });
    const { destination } = result.redirect;
    expect(destination).toBe(`/item/${encodeURIComponent(itemId)}`);
  });
});
