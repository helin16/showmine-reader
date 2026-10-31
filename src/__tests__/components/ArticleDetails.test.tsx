import { render, screen, waitFor } from '@testing-library/react';
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
      await screen.findByText(props.item?.title || item.title);
      return { wx, ...view };
    };

    test('shows a spinner until WeChat is ready', () => {
      ready.mockReturnValue(new Promise(() => undefined));
      const { container } = render(<ArticleDetails item={item} />);
      expect(container.querySelector('.spinner')).not.toBeNull();
      expect(screen.queryByText('Hello')).not.toBeInTheDocument();
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
      await screen.findByText('Hello');
      expect(consoleError).toHaveBeenCalledWith(error);
    });

    // Current behaviour, reported as a bug: the handlers are bound while the
    // spinner has replaced the article, so the selector matches nothing and the
    // images that appear afterwards have no handler. A fix should flip this.
    test('does not preview images in the rendered article', async () => {
      const { wx, container } = await renderShared({
        item: { ...item, content: '<img src="https://x/1.png">' }
      });
      container.querySelector('img')!.click();
      expect(wx.previewImage).not.toHaveBeenCalled();
    });

    // Because of the bug above, the click handler can only be reached through a
    // node that outlives the spinner, so this one stands in for the article.
    test('the preview handler opens the clicked image in the gallery', async () => {
      const article = document.createElement('div');
      article.id = 'article-content-1';
      article.innerHTML = '<img src="https://x/2.png">';
      document.body.appendChild(article);

      const { wx } = await renderShared({
        item: {
          ...item,
          content:
            '<img alt="a" src="https://x/1.png" /><p>text</p><img src="https://x/2.png" class="b">'
        }
      });
      article.querySelector('img')!.click();
      article.remove();

      await waitFor(() =>
        expect(wx.previewImage).toHaveBeenCalledWith({
          current: 'https://x/2.png',
          urls: ['https://x/1.png', 'https://x/2.png']
        })
      );
    });

    test('passes an empty gallery when the content has no images', async () => {
      const article = document.createElement('div');
      article.id = 'article-content-1';
      article.innerHTML = '<img src="https://x/2.png">';
      document.body.appendChild(article);

      const { wx } = await renderShared();
      article.querySelector('img')!.click();
      article.remove();

      expect(wx.previewImage.mock.calls[0][0].urls).toStrictEqual([]);
    });
  });
});
