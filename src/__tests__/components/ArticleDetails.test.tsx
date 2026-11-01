import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ArticleDetails from '@/components/Article/ArticleDetails';
import WeChatService from '@/serivices/WeChatService';

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

    test('shares the next article opened in the same page', async () => {
      const { wx, rerender } = await renderShared();
      rerender(<ArticleDetails item={{ ...item, id: '2', title: 'Next' }} />);
      await act(async () => undefined);
      expect(wx.updateAppMessageShareData).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: 'Next' })
      );
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

  describe('video covers', () => {
    const LABEL = 'Play video 播放视频';
    const FAILED = 'Video Not Available 视频无法播放';
    const videoHtml = (name: string, attributes = 'controls="controls"') =>
      `<video ${attributes} poster="https://x/${name}.jpg"><source src="https://x/${name}.mp4" type="video/mp4"></video>`;
    const article = (content: string, id = '1') => ({ ...item, id, content });
    const failPlay = (error: Error) => play.mockRejectedValueOnce(error);
    let play: ReturnType<typeof vi.fn>;
    let pause: ReturnType<typeof vi.fn>;
    let load: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      play = vi
        .spyOn(HTMLMediaElement.prototype, 'play')
        .mockImplementation(function (this: HTMLMediaElement) {
          this.dispatchEvent(new Event('play'));
          return Promise.resolve();
        }) as any;
      pause = vi
        .spyOn(HTMLMediaElement.prototype, 'pause')
        .mockImplementation(() => undefined) as any;
      load = vi
        .spyOn(HTMLMediaElement.prototype, 'load')
        .mockImplementation(() => undefined) as any;
    });

    afterEach(() => {
      cleanup(); // while pause is still stubbed
      vi.useRealTimers();
    });

    test('shows the cover and the play icon, without video controls', () => {
      const { container } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      const button = screen.getByRole('button', { name: LABEL });
      expect(button.querySelector('svg')).toBeInTheDocument();
      expect(button.querySelector('img')).toHaveAttribute(
        'src',
        'https://x/a.jpg'
      );
      expect(container.querySelector('video')).not.toHaveAttribute('controls');
      expect(container.querySelector('video')).toHaveAttribute('preload', 'none');
      expect(play).not.toHaveBeenCalled();
    });

    test('a tap plays the same video with sound and removes the overlay', async () => {
      const { container } = render(
        <ArticleDetails
          item={article(videoHtml('a', 'controls="controls" muted'))}
        />
      );
      const video = container.querySelector('video')!;
      fireEvent.click(screen.getByRole('button', { name: LABEL }));
      expect(play).toHaveBeenCalledTimes(1);
      expect(play.mock.contexts[0]).toBe(video);
      expect(screen.queryByRole('button')).toBeNull();
      expect(container.querySelector('img')).toBeNull();
      expect(video).toHaveAttribute('controls');
      expect(video.muted).toBe(false);
      expect(load.mock.invocationCallOrder[0]).toBeLessThan(
        play.mock.invocationCallOrder[0]
      );
      await act(async () => undefined);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('copes with a play() that returns nothing', () => {
      play.mockReturnValue(undefined);
      render(<ArticleDetails item={article(videoHtml('a'))} />);
      fireEvent.click(screen.getByRole('button'));
      expect(screen.queryByRole('button')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('starting a second video pauses the first, but not audio', () => {
      const { container } = render(
        <ArticleDetails
          item={article(
            `${videoHtml('a')}<audio src="https://x/a.mp3"></audio>${videoHtml('b')}`
          )}
        />
      );
      const [first, second] = Array.from(container.querySelectorAll('video'));
      fireEvent.click(screen.getAllByRole('button')[0]);
      pause.mockClear();
      fireEvent.click(screen.getByRole('button'));
      expect(play.mock.contexts).toEqual([first, second]);
      expect(pause.mock.contexts).toEqual([first]);
    });

    test('a cover that fails to load leaves the placeholder, which still plays', () => {
      const { container } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      fireEvent.error(container.querySelector('img')!);
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('.video-cover')).toBeInTheDocument();
      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button'));
      expect(play).toHaveBeenCalledTimes(1);
    });

    test('a video without a usable cover gets the placeholder', () => {
      const { container } = render(
        <ArticleDetails
          item={article(
            '<video poster="https://assets.showmine66.com/a.jpg" controls></video><video controls></video>'
          )}
        />
      );
      expect(container.querySelectorAll('.video-cover')).toHaveLength(2);
      expect(container.querySelector('img')).toBeNull();
      expect(screen.getAllByRole('button', { name: LABEL })).toHaveLength(2);
    });

    test('rejected playback shows the message in place', async () => {
      failPlay(new DOMException('no', 'NotSupportedError'));
      const { container } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      fireEvent.click(screen.getByRole('button'));
      await act(async () => undefined);
      expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
      expect(screen.getByRole('alert').parentElement).toBe(
        container.querySelector('video')!.parentElement
      );
    });

    test('a pause while starting is not a failure', async () => {
      failPlay(new DOMException('interrupted', 'AbortError'));
      render(<ArticleDetails item={article(videoHtml('a'))} />);
      fireEvent.click(screen.getByRole('button'));
      await act(async () => undefined);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('a missing file shows the message, though only the last source counts', () => {
      play.mockReturnValue(new Promise(() => undefined));
      const { container } = render(
        <ArticleDetails
          item={article(
            '<video controls><source src="https://x/a.webm"><source src="https://x/a.mp4"></video>'
          )}
        />
      );
      fireEvent.click(screen.getByRole('button'));
      const [first, last] = Array.from(container.querySelectorAll('source'));
      fireEvent.error(first);
      expect(screen.queryByRole('alert')).toBeNull();
      fireEvent.error(last);
      expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    });

    test('never waits forever, and playing later removes the message', () => {
      vi.useFakeTimers();
      play.mockReturnValue(new Promise(() => undefined));
      const { container } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      fireEvent.click(screen.getByRole('button'));
      vi.advanceTimersByTime(14999);
      expect(screen.queryByRole('alert')).toBeNull();
      vi.advanceTimersByTime(1);
      expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
      fireEvent.timeUpdate(container.querySelector('video')!);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    test.each([['timeUpdate'], ['pause']] as const)(
      'stops waiting after %s',
      event => {
        vi.useFakeTimers();
        const { container } = render(
          <ArticleDetails item={article(videoHtml('a'))} />
        );
        fireEvent.click(screen.getByRole('button'));
        fireEvent[event](container.querySelector('video')!);
        vi.advanceTimersByTime(15000);
        expect(screen.queryByRole('alert')).toBeNull();
      }
    );

    test('leaves embedded players and audio alone', () => {
      const others =
        '<iframe src="https://v.qq.com/x"></iframe><audio controls="controls" src="https://x/a.mp3"></audio>';
      const { container } = render(
        <ArticleDetails item={article(`<p>a</p>${others}`)} />
      );
      expect(container.querySelector('#article-content-1')!.innerHTML).toBe(
        `<p>a</p>${others}`
      );
      expect(screen.queryByRole('button')).toBeNull();
    });

    test('the preview ignores covers and lists only article images', async () => {
      const wx = makeWx();
      isInWeChat.mockReturnValue(true);
      ready.mockResolvedValue({ wx });
      const { container } = render(
        <ArticleDetails
          item={article(
            `<img src="https://x/1.png">${videoHtml('a')}${videoHtml('b')}<img src="https://x/2.png">`
          )}
        />
      );
      await act(async () => undefined);
      const covers = container.querySelectorAll('button img');
      expect(covers).toHaveLength(2);

      fireEvent.click(covers[0]);
      expect(wx.previewImage).not.toHaveBeenCalled();
      expect(play).toHaveBeenCalledTimes(1);

      fireEvent.click(container.querySelector('img')!);
      expect(wx.previewImage).toHaveBeenCalledWith({
        current: 'https://x/1.png',
        urls: ['https://x/1.png', 'https://x/2.png']
      });
    });

    test('keeps the covers when WeChat re-renders the article', async () => {
      isInWeChat.mockReturnValue(true);
      ready.mockResolvedValue({ wx: makeWx() });
      render(<ArticleDetails item={article(videoHtml('a'))} />);
      await act(async () => undefined);
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    test('sets up the next article in the same page and stops the old one', () => {
      const { container, rerender } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      const oldVideo = container.querySelector('video')!;
      fireEvent.click(screen.getByRole('button'));
      rerender(<ArticleDetails item={article(videoHtml('b'), '2')} />);
      expect(pause.mock.contexts).toEqual([oldVideo]);
      expect(container.querySelector('video')).not.toBe(oldVideo);
      expect(container.querySelector('video')).not.toHaveAttribute('controls');
      expect(container.querySelector('button img')).toHaveAttribute(
        'src',
        'https://x/b.jpg'
      );
    });

    test('resets the cover when the next article has the same content', () => {
      const { container, rerender } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      fireEvent.click(screen.getByRole('button'));
      rerender(<ArticleDetails item={article(videoHtml('a'), '2')} />);
      expect(container.querySelectorAll('.video-cover')).toHaveLength(1);
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    test('gives the video back when the article closes', () => {
      const { container, unmount } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      const video = container.querySelector('video')!;
      unmount();
      expect(pause.mock.contexts).toEqual([video]);
      expect(video).toHaveAttribute('controls');
    });

    test('the play control works by keyboard', () => {
      render(<ArticleDetails item={article(videoHtml('a'))} />);
      const button = screen.getByRole('button', { name: LABEL });
      expect(button).toHaveAttribute('type', 'button');
      expect(button.tabIndex).toBe(0);
      button.focus();
      expect(button).toHaveFocus();
      // Browsers turn Enter and Space on a focused button into this click; jsdom does not.
      button.click();
      expect(play).toHaveBeenCalledTimes(1);
    });

    test('moves keyboard focus to the player', () => {
      const { container } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      const video = container.querySelector('video')!;
      const focus = vi.spyOn(video, 'focus');
      fireEvent.click(screen.getByRole('button'));
      expect(focus).toHaveBeenCalled();
    });

    test('leaves alone a video tapped before the page was ready', () => {
      vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(
        false
      );
      const { container } = render(
        <ArticleDetails item={article(videoHtml('a'))} />
      );
      expect(screen.queryByRole('button')).toBeNull();
      expect(container.querySelector('video')).toHaveAttribute('controls');
    });

    test.each([
      ['fixed pixels', 'style="width: 986px; height: 493px;" controls', '50%'],
      ['size attributes', 'width="640" height="360" controls', '56.25%']
    ])('keeps the shape of %s', (_name, attributes, paddingTop) => {
      const { container } = render(
        <ArticleDetails item={article(videoHtml('a', attributes))} />
      );
      const wrapper = container.querySelector<HTMLElement>('.video-cover')!;
      expect(wrapper.style.paddingTop).toBe(paddingTop);
      fireEvent.load(container.querySelector('img')!);
      expect(wrapper.style.paddingTop).toBe(paddingTop);
    });

    test('takes the shape of a 100% wide video from its cover', () => {
      const { container } = render(
        <ArticleDetails
          item={article(videoHtml('a', 'width="100%" height="240" controls'))}
        />
      );
      const wrapper = container.querySelector<HTMLElement>('.video-cover')!;
      expect(wrapper.style.paddingTop).toBe('');
      const cover = container.querySelector('img')!;
      vi.spyOn(cover, 'naturalWidth', 'get').mockReturnValue(400);
      vi.spyOn(cover, 'naturalHeight', 'get').mockReturnValue(300);
      fireEvent.load(cover);
      expect(wrapper.style.paddingTop).toBe('75%');
    });

    test('server HTML is a native video that hydrates without surprises', async () => {
      const consoleError = vi.spyOn(console, 'error');
      const element = <ArticleDetails item={article(videoHtml('a'))} />;
      const html = renderToString(element);
      expect(html).toContain('<video playsinline');
      expect(html).toContain('controls="controls"');
      expect(html).not.toContain('<button');

      const root = document.createElement('div');
      root.innerHTML = html;
      document.body.append(root);
      const hydrated = await act(async () => hydrateRoot(root, element));
      expect(root.querySelector('.video-cover button')).toBeInTheDocument();
      expect(consoleError).not.toHaveBeenCalled();
      await act(async () => hydrated.unmount());
      root.remove();
    });
  });
});
