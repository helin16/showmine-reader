import { beforeEach, describe, expect, test, vi } from 'vitest';
import AppService from '@/serivices/AppService';

const { initialize, WechatJSSDK } = vi.hoisted(() => {
  const initialize = vi.fn(() => 'ready');
  return {
    initialize,
    WechatJSSDK: vi.fn(function WechatJSSDK(this: any, config: any) {
      this.config = config;
      this.initialize = initialize;
    })
  };
});

vi.mock('wechat-jssdk/dist/client.umd', () => ({ default: WechatJSSDK }));
vi.mock('@/serivices/AppService', () => ({
  default: { post: vi.fn() }
}));

const load = async () => {
  vi.resetModules();
  return (await import('@/serivices/WeChatService')).default;
};

describe('WeChatService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.stubEnv('NEXT_PUBLIC_API_END_POINT', 'https://api.example');
    vi.stubEnv('NEXT_PUBLIC_READER_BASE_URL', 'https://reader.example');
  });

  test('getWeChatJsConfig() posts the page URL', async () => {
    const service = await load();
    vi.mocked(AppService.post).mockResolvedValue({ data: { sig: 'a' } } as any);
    await expect(service.getWeChatJsConfig('https://x')).resolves.toStrictEqual({
      sig: 'a'
    });
    expect(AppService.post).toHaveBeenCalledWith(
      '/weChat/js/conf',
      { url: 'https://x' },
      undefined
    );
  });

  test('getWeChatJsConfig() passes on API failures', async () => {
    const service = await load();
    vi.mocked(AppService.post).mockRejectedValue(new Error('down'));
    await expect(service.getWeChatJsConfig('https://x')).rejects.toThrow('down');
  });

  test('getShareItemUrl() goes through the API redirect', async () => {
    const service = await load();
    expect(service.getShareItemUrl('a')).toBe(
      'https://api.example/item/redirect?itemId=a&from=wechat'
    );
  });

  test('getItemCurrentUrl() uses the reader address', async () => {
    const service = await load();
    expect(service.getItemCurrentUrl('a')).toBe(
      'https://reader.example/item/a'
    );
  });

  test.each([
    ['Mozilla/5.0 MicroMessenger/8.0', true],
    ['Mozilla/5.0 Safari', false]
  ])('isInWeChat() for %s', async (userAgent, expected) => {
    const service = await load();
    vi.stubGlobal('navigator', { userAgent });
    expect(service.isInWeChat()).toBe(expected);
    vi.unstubAllGlobals();
  });

  test('runWhenWXReady() uses a supplied config once', async () => {
    const service = await load();
    await expect(service.runWhenWXReady({ sig: 'a' })).resolves.toBe('ready');
    await service.runWhenWXReady({ sig: 'b' });
    expect(WechatJSSDK).toHaveBeenCalledTimes(1);
    expect(WechatJSSDK.mock.calls[0][0]).toMatchObject({ sig: 'a' });
    expect(initialize).toHaveBeenCalledTimes(2);
  });

  test('runWhenWXReady() fetches a config when none is supplied', async () => {
    const service = await load();
    vi.mocked(AppService.post).mockResolvedValue({ data: { sig: 'c' } } as any);
    await service.runWhenWXReady();
    expect(AppService.post).toHaveBeenCalledTimes(1);
    expect(WechatJSSDK.mock.calls[0][0]).toMatchObject({ sig: 'c' });
  });
});
