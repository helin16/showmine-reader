import { afterEach, describe, expect, test, vi } from 'vitest';
import AppService from '@/serivices/AppService';
import WebsiteService from '@/serivices/WebsiteService';

describe('WebsiteService.getPublicWebsite()', () => {
  afterEach(() => vi.restoreAllMocks());

  test('asks for the published copy, with the preview token when there is one', async () => {
    const get = vi
      .spyOn(AppService, 'get')
      .mockResolvedValue({ data: { slug: 'a b' } } as any);
    await expect(WebsiteService.getPublicWebsite('a b')).resolves.toStrictEqual(
      { slug: 'a b' }
    );
    expect(get).toHaveBeenLastCalledWith('/publicWebsite/a%20b', undefined);
    await WebsiteService.getPublicWebsite('shop', 'tok');
    expect(get).toHaveBeenLastCalledWith('/publicWebsite/shop', {
      preview: 'tok'
    });
  });
});
