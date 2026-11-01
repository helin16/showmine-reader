import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ArticleDetails from '@/components/Article/ArticleDetails';
import WeChatService from '@/serivices/WeChatService';

vi.mock('wechat-jssdk/dist/client.umd', () => ({ default: vi.fn() }));

// No offset, so moment reads and prints it the same in every time zone.
const item: any = {
  id: '1',
  title: 'Hello',
  content: '<p>Body</p>',
  noOfVisits: 7,
  publishedAt: '2024-03-05T09:30:00'
};

const makeWx = () => ({
  previewImage: vi.fn(),
  updateAppMessageShareData: vi.fn(),
  updateTimelineShareData: vi.fn()
});

describe('ArticleDetails', () => {
  let ready: ReturnType<typeof vi.fn>;
  let isInWeChat: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isInWeChat = vi.spyOn(WeChatService, 'isInWeChat') as any;
    isInWeChat.mockReturnValue(false);
    ready = vi.spyOn(WeChatService, 'runWhenWXReady') as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('outside WeChat', () => {
    test('shows the article and does not start WeChat', () => {
      render(<ArticleDetails item={item} />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('2024-03-05 09:30')).toBeInTheDocument();
      expect(screen.getByText('阅读: 7')).toBeInTheDocument();
      expect(ready).not.toHaveBeenCalled();
    });

    test('copes with an article without content', () => {
      const { container } = render(
        <ArticleDetails item={{ ...item, content: null }} />
      );
      expect(container.querySelector('#article-content-1')).toBeEmptyDOMElement();
      expect(screen.getByText('- END -')).toBeInTheDocument();
    });

    // Current behaviour, reported as a bug: moment(null) is invalid.
    test('prints Invalid date for a null publish date', () => {
      render(<ArticleDetails item={{ ...item, publishedAt: null }} />);
      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });
  });

  describe('author', () => {
    const withAuthor = (Author: any) =>
      render(<ArticleDetails item={{ ...item, Author }} />);

    test.each([
      ['no author', undefined],
      ['a blank name', { name: '  ', url: 'https://a.example' }]
    ])('is hidden for %s', (_name, author) => {
      const { container } = withAuthor(author);
      expect(container.querySelector('.author')).toBeNull();
    });

    test.each([[undefined], ['   ']])(
      'is plain text for the address %j',
      url => {
        withAuthor({ name: 'Ann', url });
        expect(screen.getByText('Ann').tagName).toBe('SPAN');
      }
    );

    test.each([
      ['https://a.example', 'https://a.example'],
      ['http://a.example', 'http://a.example'],
      ['ftp://a.example', 'ftp://a.example'],
      [' a.example ', 'http://a.example']
    ])('links %j as %j', (url, href) => {
      withAuthor({ name: 'Ann', url });
      expect(screen.getByRole('link', { name: 'Ann' })).toHaveAttribute(
        'href',
        href
      );
    });
  });

  describe('company footer', () => {
    test('shows the default footer as HTML', () => {
      render(
        <ArticleDetails
          item={{ ...item, Company: { itemDefaultFooter: '<b>Bye</b>' } }}
        />
      );
      expect(screen.getByText('Bye').tagName).toBe('B');
    });

    test.each([[undefined], [null], ['   ']])(
      'is hidden for %j',
      itemDefaultFooter => {
        const { container } = render(
          <ArticleDetails item={{ ...item, Company: { itemDefaultFooter } }} />
        );
        expect(container.querySelector('.default-footer')).toBeNull();
      }
    );
  });

  describe('inside WeChat', () => {
    beforeEach(() => {
      isInWeChat.mockReturnValue(true);
      vi.spyOn(console, 'log').mockImplementation(() => undefined);
      vi.stubEnv('NEXT_PUBLIC_API_END_POINT', 'https://api.example');
    });

    const renderShared = async (props: any = {}) => {
      const wx = makeWx();
      ready.mockResolvedValue({ wx });
      const view = render(<ArticleDetails item={item} {...props} />);
      await act(async () => undefined);
      return { wx, ...view };
    };

    test('shows the article while WeChat never gets ready', () => {
      ready.mockReturnValue(new Promise(() => undefined));
      const { container } = render(<ArticleDetails item={item} />);
      expect(container.querySelector('.spinner')).toBeNull();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    test('passes on the server config', async () => {
      await renderShared({ jsConfig: { sig: 'a' } });
      expect(ready).toHaveBeenCalledWith({ sig: 'a' });
    });

    test('sets up sharing with friends', async () => {
      const { wx } = await renderShared({
        item: {
          ...item,
          excerpt: '<i>Summary</i>',
          CoverAsset: { url: 'https://c.example/image/upload/a.png' }
        }
      });
      expect(wx.updateAppMessageShareData).toHaveBeenCalledWith({
        type: 'link',
        title: 'Hello',
        link: 'https://api.example/item/redirect?itemId=1&from=wechat',
        imgUrl: 'https://c.example/image/upload/w_300/a.png',
        desc: 'Summary',
        success: expect.any(Function)
      });
      wx.updateAppMessageShareData.mock.calls[0][0].success();
      expect(console.log).toHaveBeenCalledWith(
        'updateAppMessageShareData loaded'
      );
    });

    test('sets up sharing to the timeline', async () => {
      const { wx } = await renderShared();
      expect(wx.updateTimelineShareData).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'link',
          title: 'Hello',
          link: 'https://api.example/item/redirect?itemId=1&from=wechat'
        })
      );
      wx.updateTimelineShareData.mock.calls[0][0].success();
      expect(console.log).toHaveBeenCalledWith('updateTimelineShareData loaded');
    });

    test.each([[undefined], [null], ['   ']])(
      'shares the content when the excerpt is %j',
      async excerpt => {
        const { wx } = await renderShared({ item: { ...item, excerpt } });
        expect(wx.updateAppMessageShareData.mock.calls[0][0].desc).toBe('Body');
      }
    );

    test('shares an empty description when there is no text at all', async () => {
      const { wx } = await renderShared({ item: { ...item, content: null } });
      expect(wx.updateAppMessageShareData.mock.calls[0][0].desc).toBe('');
    });

    test('still shows the article when WeChat fails', async () => {
      const error = new Error('no signature');
      ready.mockRejectedValue(error);
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      render(<ArticleDetails item={item} />);
      await act(async () => undefined);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(error);
    });

    test('previews the clicked image among all the article images', async () => {
      const { wx, container } = await renderShared({
        item: {
          ...item,
          content:
            '<img alt="a" src="https://x/1.png" /><p>text</p><img src="https://x/2.png" class="b">'
        }
      });
      fireEvent.click(container.querySelectorAll('img')[1]);
      expect(wx.previewImage).toHaveBeenCalledWith({
        current: 'https://x/2.png',
        urls: ['https://x/1.png', 'https://x/2.png']
      });
    });

    test('previews the images of the next article in the same page', async () => {
      const { wx, container, rerender } = await renderShared({
        item: { ...item, content: '<img src="https://x/1.png">' }
      });
      rerender(
        <ArticleDetails
          item={{ ...item, id: '2', content: '<img src="https://x/2.png">' }}
        />
      );
      fireEvent.click(container.querySelector('img')!);
      expect(wx.previewImage).toHaveBeenCalledWith({
        current: 'https://x/2.png',
        urls: ['https://x/2.png']
      });
    });

    test('does not preview on a click beside an image', async () => {
      const { wx } = await renderShared({
        item: { ...item, content: '<p>Text</p><img src="https://x/1.png">' }
      });
      fireEvent.click(screen.getByText('Text'));
      expect(wx.previewImage).not.toHaveBeenCalled();
    });

    test('leaves a click alone until WeChat is ready', () => {
      ready.mockReturnValue(new Promise(() => undefined));
      const { container } = render(
        <ArticleDetails
          item={{ ...item, content: '<img src="https://x/1.png">' }}
        />
      );
      expect(() =>
        fireEvent.click(container.querySelector('img')!)
      ).not.toThrow();
    });
  });
});
