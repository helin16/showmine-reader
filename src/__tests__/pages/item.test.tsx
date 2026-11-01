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
vi.mock('@/components/Article/ArticleComments', () => ({
  default: ({ itemId }: any) => <div>comments:{itemId}</div>
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

    test('keeps the item when only the WeChat config fails', async () => {
      vi.mocked(ItemService.getItemById).mockResolvedValue({ id: 'a' } as any);
      const error = new Error('signature');
      vi.mocked(weChatService.getWeChatJsConfig).mockRejectedValue(error);
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const result: any = await getServerSideProps({ params: { id: 'a' } });
      expect(result.props).toStrictEqual({ item: { id: 'a' }, config: null });
      expect(consoleError).toHaveBeenCalledWith('signature');
      consoleError.mockRestore();
    });

    test('does not wait indefinitely for the WeChat config', async () => {
      vi.mocked(ItemService.getItemById).mockResolvedValue({ id: 'a' } as any);
      vi.mocked(weChatService.getWeChatJsConfig).mockResolvedValue({});
      await getServerSideProps({ params: { id: 'a' } });
      expect(weChatService.getWeChatJsConfig).toHaveBeenLastCalledWith(
        undefined,
        undefined,
        { timeout: expect.any(Number) }
      );
    });

    describe('rate limited', () => {
      const limited = () =>
        Object.assign(new Error('Request failed with status code 429'), {
          response: { status: 429 },
          config: { headers: { 'X-SHM-SERVER-KEY': 'server-key' } }
        });

      test('says so for the item, with the status of the failure', async () => {
        vi.mocked(ItemService.getItemById).mockRejectedValue(limited());
        vi.mocked(weChatService.getWeChatJsConfig).mockResolvedValue({});
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const res = { statusCode: 200 };
        const result: any = await getServerSideProps({
          params: { id: 'a' },
          res
        });
        expect(result.props).toStrictEqual({
          item: {},
          config: null,
          isRateLimited: true
        });
        expect(res.statusCode).toBe(429);
      });

      test('keeps the article when only the WeChat config is limited', async () => {
        vi.mocked(ItemService.getItemById).mockResolvedValue({
          id: 'a'
        } as any);
        vi.mocked(weChatService.getWeChatJsConfig).mockRejectedValue(limited());
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const res = { statusCode: 200 };
        const result: any = await getServerSideProps({
          params: { id: 'a' },
          res
        });
        expect(result.props).toStrictEqual({ item: { id: 'a' }, config: null });
        expect(res.statusCode).toBe(200);
      });

      // An axios error carries its request headers, so logging it would put the server key in the logs.
      test.each([
        ['item', ItemService.getItemById],
        ['WeChat config', weChatService.getWeChatJsConfig]
      ])('logs only the message for the %s', async (_name, call: any) => {
        vi.mocked(ItemService.getItemById).mockResolvedValue({} as any);
        vi.mocked(weChatService.getWeChatJsConfig).mockResolvedValue({});
        call.mockRejectedValue(limited());
        const consoleError = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        await getServerSideProps({
          params: { id: 'a' },
          res: { statusCode: 200 }
        });
        expect(consoleError).toHaveBeenCalledExactlyOnceWith(
          'Request failed with status code 429'
        );
      });
    });

    // undefined props are not serializable, which next dev rejects.
    test('returns a null config when both requests fail', async () => {
      vi.mocked(ItemService.getItemById).mockRejectedValue(new Error('404'));
      vi.mocked(weChatService.getWeChatJsConfig).mockRejectedValue(
        new Error('signature')
      );
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const result: any = await getServerSideProps({ params: { id: 'a' } });
      expect(result.props).toStrictEqual({ item: {}, config: null });
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
    test('shows the error page saying to wait when rate limited', () => {
      render(<ItemDetailsPage item={{}} isRateLimited />);
      expect(screen.getByText(/Too Many Requests/)).toBeInTheDocument();
      expect(screen.queryByText(/Item Not Available/)).not.toBeInTheDocument();
    });

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

  describe('comments', () => {
    const item = { id: 'a', title: 'T', isPublished: true };

    test('show under an article with comments on', () => {
      render(<ItemDetailsPage item={{ ...item, enableCommentsFlag: true }} />);
      expect(screen.getByText('comments:a')).toBeInTheDocument();
    });

    test.each([[false], [undefined]])('stay away when the flag is %s', (flag) => {
      render(<ItemDetailsPage item={{ ...item, enableCommentsFlag: flag }} />);
      expect(screen.queryByText(/comments:/)).not.toBeInTheDocument();
    });

    test('stay away from an unpublished article', () => {
      render(<ItemDetailsPage item={{ ...item, isPublished: false, enableCommentsFlag: true }} />);
      expect(screen.queryByText(/comments:/)).not.toBeInTheDocument();
    });
  });
});
