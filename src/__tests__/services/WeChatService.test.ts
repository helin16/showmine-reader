import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AppService from '@/serivices/AppService';

vi.mock('@/serivices/AppService', () => ({
  default: { post: vi.fn() }
}));

const load = async () => {
  vi.resetModules();
  return (await import('@/serivices/WeChatService')).default;
};

const SCRIPT_URL = 'https://res.wx.qq.com/open/js/jweixin-1.4.0.js';

const makeWx = () => ({
  config: vi.fn(),
  ready: vi.fn((callback: () => void) => callback()),
  error: vi.fn()
});

describe('WeChatService', () => {
  let wx: ReturnType<typeof makeWx>;
  let appendScript: any;

  // Stands in for the browser fetching WeChat's file, which defines window.wx.
  const scriptLoads = () =>
    appendScript.mockImplementation((script: HTMLScriptElement) => {
      (window as any).wx = wx;
      script.onload?.(new Event('load'));
      return script;
    });

  afterEach(() => {
    delete (window as any).wx;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    wx = makeWx();
    appendScript = vi.spyOn(document.head, 'appendChild');
    scriptLoads();
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

  test('runWhenWXReady() loads the official script once', async () => {
    const service = await load();
    await service.runWhenWXReady({ sig: 'a' });
    await service.runWhenWXReady({ sig: 'a' });
    expect(appendScript).toHaveBeenCalledTimes(1);
    const script = appendScript.mock.calls[0][0];
    expect(script.src).toBe(SCRIPT_URL);
    expect(script.async).toBe(true);
  });

  test('runWhenWXReady() passes on the wx object once it is ready', async () => {
    const service = await load();
    wx.ready.mockImplementation(() => undefined);
    let result: any;
    const running = service.runWhenWXReady({ sig: 'a' }).then(value => {
      result = value;
    });
    await vi.waitFor(() => expect(wx.ready).toHaveBeenCalled());
    expect(wx.config).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
    wx.ready.mock.calls[0][0]();
    await running;
    expect(result).toStrictEqual({ wx });
  });

  test('runWhenWXReady() uses a supplied config once', async () => {
    const service = await load();
    await service.runWhenWXReady({ sig: 'a' });
    await service.runWhenWXReady({ sig: 'b' });
    expect(wx.config).toHaveBeenCalledTimes(2);
    expect(wx.config.mock.calls[1][0]).toMatchObject({ sig: 'a' });
  });

  test('runWhenWXReady() fetches a config when none is supplied', async () => {
    const service = await load();
    vi.mocked(AppService.post).mockResolvedValue({ data: { sig: 'c' } } as any);
    await service.runWhenWXReady();
    expect(AppService.post).toHaveBeenCalledTimes(1);
    expect(wx.config.mock.calls[0][0]).toMatchObject({ sig: 'c' });
  });

  test('runWhenWXReady() requests every API the article page uses', async () => {
    const service = await load();
    await service.runWhenWXReady({ sig: 'a' });
    expect(wx.config.mock.calls[0][0].jsApiList).toEqual(
      expect.arrayContaining([
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'previewImage'
      ])
    );
  });

  test('runWhenWXReady() passes on a failed config request', async () => {
    const service = await load();
    vi.mocked(AppService.post).mockRejectedValue(new Error('down'));
    await expect(service.runWhenWXReady()).rejects.toThrow('down');
    expect(appendScript).not.toHaveBeenCalled();
  });

  test('runWhenWXReady() passes on a rejected signature', async () => {
    const service = await load();
    const error = { errMsg: 'config:invalid signature' };
    wx.ready.mockImplementation(() => undefined);
    wx.error.mockImplementation((callback: (err: any) => void) =>
      callback(error)
    );
    await expect(service.runWhenWXReady({ sig: 'a' })).rejects.toBe(error);
  });

  test('runWhenWXReady() tries the script again after a failed load', async () => {
    const service = await load();
    const failure = new Event('error');
    appendScript.mockImplementationOnce((script: HTMLScriptElement) => {
      script.onerror?.(failure);
      return script;
    });
    await expect(service.runWhenWXReady({ sig: 'a' })).rejects.toBe(failure);
    await expect(service.runWhenWXReady({ sig: 'a' })).resolves.toStrictEqual({
      wx
    });
    expect(appendScript).toHaveBeenCalledTimes(2);
  });

  test('runWhenWXReady() fails when the script defines no wx', async () => {
    const service = await load();
    appendScript.mockImplementation((script: HTMLScriptElement) => {
      script.onload?.(new Event('load'));
      return script;
    });
    await expect(service.runWhenWXReady({ sig: 'a' })).rejects.toThrow(
      'wx js not defined'
    );
  });

  // Current behaviour, reported as a bug: the empty check logs but does not
  // return, so the next line dereferences null.
  test('runWhenWXReady() throws when there is no WeChat object', async () => {
    const service = await load();
    vi.stubGlobal('window', undefined);
    await expect(service.runWhenWXReady()).rejects.toThrow(TypeError);
    expect(console.log).toHaveBeenCalledWith('XW is empty');
    vi.unstubAllGlobals();
  });
});
