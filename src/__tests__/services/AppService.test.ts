import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import axios from 'axios';
import AppService from '@/serivices/AppService';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

const API = 'https://api.example';
const baseHeaders = { 'X-SHM-TOKEN': 'app-token' };

describe('AppService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_API_END_POINT', API);
    vi.stubEnv('NEXT_PUBLIC_APP_TOKEN', 'app-token');
    vi.stubEnv('NEXT_PUBLIC_HEADER_NAME_COMPANY_ID', undefined);
    vi.stubEnv('NEXT_PUBLIC_HEADER_NAME_APP_TOKEN', undefined);
    vi.stubEnv('NEXT_PUBLIC_LOCAL_USER_TOKEN_NAME', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('header names', () => {
    test('have defaults', () => {
      expect(AppService.getHeaderCompanyIdName()).toBe('comid');
      expect(AppService.getHeaderAppTokenName()).toBe('X-SHM-TOKEN');
    });

    test('can be configured', () => {
      vi.stubEnv('NEXT_PUBLIC_HEADER_NAME_COMPANY_ID', 'x-company');
      vi.stubEnv('NEXT_PUBLIC_HEADER_NAME_APP_TOKEN', 'x-app');
      expect(AppService.getHeaderCompanyIdName()).toBe('x-company');
      expect(AppService.getHeaderAppTokenName()).toBe('x-app');
    });
  });

  describe('get()', () => {
    test('sends the app token and no query string by default', () => {
      AppService.get('/item');
      expect(axios.get).toHaveBeenCalledWith(`${API}/item`, {
        headers: baseHeaders
      });
    });

    test('sends an empty app token when none is configured', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_TOKEN', undefined);
      AppService.get('/item');
      expect(axios.get).toHaveBeenCalledWith(`${API}/item`, {
        headers: { 'X-SHM-TOKEN': '' }
      });
    });

    test('encodes params into the query string', () => {
      AppService.get('/item', { a: 1, q: 'x y&z' });
      expect(axios.get).toHaveBeenCalledWith(
        `${API}/item?a=1&q=x+y%26z`,
        expect.anything()
      );
    });

    test('ignores params that are not an object', () => {
      AppService.get('/item', 'nope' as any);
      expect(axios.get).toHaveBeenCalledWith(`${API}/item`, expect.anything());
    });

    test('adds the bearer token when the user has one', () => {
      localStorage.setItem('token', 'user-token');
      AppService.get('/item');
      expect(axios.get).toHaveBeenCalledWith(`${API}/item`, {
        headers: { ...baseHeaders, Authorization: 'Bearer user-token' }
      });
    });

    test('merges config and extra headers', () => {
      AppService.get('/item', {}, { timeout: 5, headers: { comid: 'c1' } });
      expect(axios.get).toHaveBeenCalledWith(`${API}/item`, {
        timeout: 5,
        headers: { ...baseHeaders, comid: 'c1' }
      });
    });

    test('passes on the response and failures', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: 1 });
      await expect(AppService.get('/item')).resolves.toStrictEqual({ data: 1 });
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('down'));
      await expect(AppService.get('/item')).rejects.toThrow('down');
    });
  });

  test('post() sends the body with config and auth headers', () => {
    AppService.post('/a', { x: 1 }, { timeout: 5 });
    expect(axios.post).toHaveBeenCalledWith(
      `${API}/a`,
      { x: 1 },
      { timeout: 5, headers: baseHeaders }
    );
  });

  test('put() sends the body with config and auth headers', () => {
    AppService.put('/a', { x: 1 }, { timeout: 5 });
    expect(axios.put).toHaveBeenCalledWith(
      `${API}/a`,
      { x: 1 },
      { timeout: 5, headers: baseHeaders }
    );
  });

  test('delete() sends params in the query string', () => {
    AppService.delete('/a', { x: 1 }, { timeout: 5 });
    expect(axios.delete).toHaveBeenCalledWith(`${API}/a?x=1`, {
      timeout: 5,
      headers: baseHeaders
    });
  });

  test('delete() has no query string without params', () => {
    AppService.delete('/a');
    expect(axios.delete).toHaveBeenCalledWith(`${API}/a`, {
      headers: baseHeaders
    });
  });

  // Current behaviour, reported as a bug: unlike get(), these spread
  // getHeaders() over config, so headers passed by the caller are lost.
  test.each([
    ['put', () => AppService.put('/a', {}, { headers: { comid: 'c1' } })]
  ] as const)('%s() drops headers passed in config', (method, call) => {
    call();
    expect(vi.mocked(axios[method]).mock.calls[0][2]?.headers).toStrictEqual(
      baseHeaders
    );
  });

  test('post() keeps headers passed in config', () => {
    AppService.post('/a', {}, { headers: { Authorization: 'Bearer a' } });
    expect(vi.mocked(axios.post).mock.calls[0][2]?.headers).toStrictEqual({
      ...baseHeaders,
      Authorization: 'Bearer a'
    });
  });

  // Current behaviour, reported as a bug: getUploadHeaders() spreads the whole
  // { headers } object, so the app token ends up under headers.headers and is
  // never sent as a real header.
  test('uploadImage() nests the auth headers one level too deep', () => {
    const form = new FormData();
    AppService.uploadImage('/asset', form, { timeout: 5 });
    expect(axios.post).toHaveBeenCalledWith(`${API}/asset`, form, {
      timeout: 5,
      headers: {
        headers: baseHeaders,
        'Content-Type': 'multipart/form-data'
      }
    });
  });

  describe('server key', () => {
    const SERVER_KEY_HEADER = 'X-SHM-SERVER-KEY';

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test.each([
      ['get()', () => AppService.get('/item'), axios.get, 1],
      ['post()', () => AppService.post('/x', {}), axios.post, 2],
      ['put()', () => AppService.put('/x', {}), axios.put, 2],
      ['delete()', () => AppService.delete('/x'), axios.delete, 1]
    ])('%s sends it from the server', (_name, call, verb: any, configArg) => {
      vi.stubGlobal('window', undefined);
      vi.stubEnv('SHOWMINE_SERVER_KEY', ' server-key ');
      call();
      expect(verb.mock.lastCall[configArg].headers).toStrictEqual({
        ...baseHeaders,
        [SERVER_KEY_HEADER]: 'server-key'
      });
    });

    test('is never sent from the browser', () => {
      vi.stubEnv('SHOWMINE_SERVER_KEY', 'server-key');
      AppService.get('/item');
      expect(axios.get).toHaveBeenLastCalledWith(`${API}/item`, {
        headers: baseHeaders
      });
    });

    test('is left out until it is set', () => {
      vi.stubGlobal('window', undefined);
      vi.stubEnv('SHOWMINE_SERVER_KEY', undefined);
      AppService.get('/item');
      expect(axios.get).toHaveBeenLastCalledWith(`${API}/item`, {
        headers: baseHeaders
      });
    });
  });

  test('passes a 429 on to the page, with no second try', async () => {
    const limited = Object.assign(new Error('429'), {
      response: { status: 429 }
    });
    vi.mocked(axios.get).mockClear().mockRejectedValueOnce(limited);
    await expect(AppService.get('/item')).rejects.toBe(limited);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
