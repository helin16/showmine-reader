import { afterEach, describe, expect, test, vi } from 'vitest';
import AppService from '@/serivices/AppService';
import ItemService from '@/serivices/ItemService';

describe('ItemService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('getItemById()', () => {
    test('returns the response body', async () => {
      const get = vi
        .spyOn(AppService, 'get')
        .mockResolvedValue({ data: { id: 'a' } } as any);
      const params = { include: 'Author' };
      const config = { timeout: 5 };
      await expect(
        ItemService.getItemById('a', params, config)
      ).resolves.toStrictEqual({ id: 'a' });
      expect(get).toHaveBeenCalledWith('/item/a', params, config);
    });

    test('passes on API failures', async () => {
      vi.spyOn(AppService, 'get').mockRejectedValue(new Error('404'));
      await expect(ItemService.getItemById('a')).rejects.toThrow('404');
    });
  });

  describe('getAllItemsUnderCompany()', () => {
    test('sends the company id as a header', async () => {
      const get = vi
        .spyOn(AppService, 'get')
        .mockResolvedValue({ data: { data: [] } } as any);
      const params = { perPage: 5 };
      await expect(
        ItemService.getAllItemsUnderCompany('c1', params)
      ).resolves.toStrictEqual({ data: [] });
      expect(get).toHaveBeenCalledWith('/item', params, {
        headers: { comid: 'c1' }
      });
    });

    test('passes on API failures', async () => {
      vi.spyOn(AppService, 'get').mockRejectedValue(new Error('down'));
      await expect(ItemService.getAllItemsUnderCompany('c1')).rejects.toThrow(
        'down'
      );
    });
  });

  describe('prepareVideoHtml()', () => {
    test('plays videos inside the page on iPhones', () => {
      const html = ItemService.prepareVideoHtml(
        '<video poster="https://cdn.example/a.jpg" controls="controls"><source src="https://cdn.example/a.mp4"></video>'
      );
      expect(html).toBe(
        '<video playsinline webkit-playsinline preload="none" poster="https://cdn.example/a.jpg" controls="controls"><source src="https://cdn.example/a.mp4"></video>'
      );
    });

    test('keeps a real cover on the assets host', () => {
      const html = ItemService.prepareVideoHtml(
        '<video poster="https://assets.showmine66.com/c/a.jpg"></video>'
      );
      expect(html).toContain('poster="https://assets.showmine66.com/c/a.jpg"');
    });

    test.each([
      ['https://assets.jpgshowmine66.com/c/a.mp4']
    ])('removes the broken cover %s', poster => {
      const html = ItemService.prepareVideoHtml(
        `<video poster="${poster}" controls="controls">\n<source src="https://assets.showmine66.com/c/a.mp4" type="video/mp4"></video>`
      );
      expect(html).not.toContain('poster');
      expect(html).toContain('src="https://assets.showmine66.com/c/a.mp4"');
    });

    test.each([
      ['autoplay'],
      ['autoplay="autoplay"'],
      ["autoplay='true'"],
      ['autoplay=1']
    ])('removes %s, so nothing plays before a tap', attribute => {
      const html = ItemService.prepareVideoHtml(
        `<video ${attribute} controls="controls"></video>`
      );
      expect(html).toBe(
        '<video playsinline webkit-playsinline preload="none" controls="controls"></video>'
      );
    });

    test('the first preload wins over a stored one', () => {
      const html = ItemService.prepareVideoHtml(
        '<video preload="auto"></video>'
      );
      const video = new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector('video')!;
      expect(video.preload).toBe('none');
    });

    test('handles every video and leaves other content alone', () => {
      const html = ItemService.prepareVideoHtml(
        '<p>a</p><video></video><iframe src="https://v.qq.com/x"></iframe><video></video>'
      );
      expect(html.match(/<video playsinline /g)).toHaveLength(2);
      expect(html).toContain('<p>a</p>');
      expect(html).toContain('<iframe src="https://v.qq.com/x"></iframe>');
    });
  });

  describe('getCoverImageUrl()', () => {
    test('asks Cloudinary for a 300 pixel image', () => {
      expect(
        ItemService.getCoverImageUrl({
          CoverAsset: { url: ' https://c.example/image/upload/v1/a.png ' }
        } as any)
      ).toBe('https://c.example/image/upload/w_300/v1/a.png');
    });

    test('leaves other addresses alone', () => {
      expect(
        ItemService.getCoverImageUrl({
          CoverAsset: { url: 'https://c.example/a.png' }
        } as any)
      ).toBe('https://c.example/a.png');
    });

    test.each([
      ['no cover', {}],
      ['a blank cover', { CoverAsset: { url: '   ' } }]
    ])('uses the default image for %s', (_name, item) => {
      vi.stubEnv('NEXT_PUBLIC_READER_BASE_URL', 'https://reader.example');
      expect(ItemService.getCoverImageUrl(item as any)).toBe(
        'https://reader.example/default.png'
      );
    });

    test('uses a relative default image when no reader address is set', () => {
      vi.stubEnv('NEXT_PUBLIC_READER_BASE_URL', undefined);
      expect(ItemService.getCoverImageUrl({} as any)).toBe('/default.png');
    });
  });

  describe('getShareDescription()', () => {
    test('prefers the excerpt, without tags or spare spaces', () => {
      expect(
        ItemService.getShareDescription({
          excerpt: ' <p>One&nbsp;two\n three</p> ',
          content: 'Body'
        } as any)
      ).toBe('One two three');
    });

    test('falls back to the content, then to nothing', () => {
      expect(
        ItemService.getShareDescription({ content: '<p>Body</p>' } as any)
      ).toBe('Body');
      expect(ItemService.getShareDescription({} as any)).toBe('');
    });

    test('keeps a card short, without cutting a character in half', () => {
      const text = '😀'.repeat(201);
      expect(ItemService.getShareDescription({ excerpt: text } as any)).toBe(
        '😀'.repeat(200)
      );
    });
  });
});
