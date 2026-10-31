import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ItemDetailsPage, { getServerSideProps } from '@/pages/item/[id]';
import ItemService from '@/serivices/ItemService';
import weChatService from '@/serivices/WeChatService';

vi.mock('@/serivices/ItemService', () => ({
  default: { getItemById: vi.fn() }
}));
vi.mock('@/serivices/WeChatService', () => ({
  default: { getWeChatJsConfig: vi.fn(), getItemCurrentUrl: vi.fn() }
}));
vi.mock('@/components/Article/ArticleDetails', () => ({
  default: ({ item }: any) => <div>article:{item.title}</div>
}));
vi.mock('@/components/Article/ArticleFooter', () => ({
  default: () => <div>footer</div>
}));
vi.mock('@/components/GTranslator', () => ({
  default: () => <div>translator</div>
}));
vi.mock('../../components/Page', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));
vi.mock('../../components/Header', () => ({ default: () => null }));

describe('item page', () => {
  describe('getServerSideProps()', () => {
    test('loads the item and WeChat config, and counts a visit', async () => {
      vi.mocked(ItemService.getItemById).mockResolvedValue({ id: 'a' } as any);
      vi.mocked(weChatService.getWeChatJsConfig).mockResolvedValue({ s: 1 });
      const result: any = await getServerSideProps({ params: { id: 'a' } });
      expect(result.props.item).toStrictEqual({ id: 'a' });
      expect(result.props.config).toStrictEqual({ s: 1 });
      expect(ItemService.getItemById).toHaveBeenCalledWith(
        'a',
        expect.objectContaining({ isVisit: '1' })
      );
    });

    test.each([['missing'], ['unpublished'], ['API failure']])(
      'returns an empty item on %s, which the API reports as an error',
      async () => {
        vi.mocked(ItemService.getItemById).mockRejectedValue(new Error('404'));
        vi.mocked(weChatService.getWeChatJsConfig).mockResolvedValue({});
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        const result: any = await getServerSideProps({ params: { id: 'a' } });
        expect(result.props.item).toStrictEqual({});
        consoleError.mockRestore();
      }
    );

    // Current behaviour, reported as a bug: Promise.all ties the article to the
    // WeChat signature, so a WeChat outage hides a valid article.
    test('loses the item when only the WeChat config fails', async () => {
      vi.mocked(ItemService.getItemById).mockResolvedValue({ id: 'a' } as any);
      vi.mocked(weChatService.getWeChatJsConfig).mockRejectedValue(
        new Error('signature')
      );
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const result: any = await getServerSideProps({ params: { id: 'a' } });
      expect(result.props.item).toStrictEqual({});
      expect(consoleError).toHaveBeenCalledTimes(1);
      consoleError.mockRestore();
    });
  });

  describe('rendering', () => {
    test('shows a published article', () => {
      render(
        <ItemDetailsPage item={{ title: 'Hello', isPublished: true }} />
      );
      expect(screen.getByText('article:Hello')).toBeInTheDocument();
      expect(screen.getByText('footer')).toBeInTheDocument();
    });

    test.each([
      ['an unpublished item', { title: 'Secret', isPublished: false }],
      ['an empty item', {}]
    ])('shows not available for %s', (_name, item) => {
      render(<ItemDetailsPage item={item} />);
      expect(screen.getByText(/文章无法访问/)).toBeInTheDocument();
      expect(screen.queryByText(/article:/)).not.toBeInTheDocument();
    });

    // Current behaviour, reported as a bug: item.enableGTranslateFlag is read
    // without a guard, so the undefined check in getContent() cannot be reached.
    // getServerSideProps always passes an object, so this needs a direct render.
    test('throws instead of showing 404 when the item is undefined', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const silence = (event: ErrorEvent) => event.preventDefault();
      window.addEventListener('error', silence);
      expect(() => render(<ItemDetailsPage />)).toThrow(TypeError);
      window.removeEventListener('error', silence);
      consoleError.mockRestore();
    });

    test('adds the translator only when enabled', () => {
      const { rerender } = render(
        <ItemDetailsPage item={{ isPublished: true, enableGTranslateFlag: true }} />
      );
      expect(screen.getByText('translator')).toBeInTheDocument();
      rerender(
        <ItemDetailsPage item={{ isPublished: true, enableGTranslateFlag: false }} />
      );
      expect(screen.queryByText('translator')).not.toBeInTheDocument();
    });
  });
});
