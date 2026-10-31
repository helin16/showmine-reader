import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import LocalStorageService from '@/serivices/LocalStorageService';

describe('LocalStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_LOCAL_USER_TOKEN_NAME', undefined);
    vi.stubEnv('NEXT_PUBLIC_LOCAL_JS_CONFIG', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test('stores, reads and removes the token under the default key', () => {
    LocalStorageService.setToken('abc');
    expect(localStorage.getItem('token')).toBe('abc');
    expect(LocalStorageService.getToken()).toBe('abc');
    LocalStorageService.removeToken();
    expect(LocalStorageService.getToken()).toBeNull();
  });

  test('stores, reads and removes the JS SDK config under the default key', () => {
    LocalStorageService.setJsSdk('{"a":1}');
    expect(localStorage.getItem('jssdk')).toBe('{"a":1}');
    expect(LocalStorageService.getJsSdk()).toBe('{"a":1}');
    LocalStorageService.removeJsSdk();
    expect(LocalStorageService.getJsSdk()).toBeNull();
  });

  test('honours the configured key names', () => {
    vi.stubEnv('NEXT_PUBLIC_LOCAL_USER_TOKEN_NAME', 'custom-token');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_JS_CONFIG', 'custom-sdk');
    LocalStorageService.setToken('abc');
    LocalStorageService.setJsSdk('sdk');
    expect(localStorage.getItem('custom-token')).toBe('abc');
    expect(localStorage.getItem('custom-sdk')).toBe('sdk');
  });

  test('keeps the token and JS SDK config separate', () => {
    LocalStorageService.setToken('abc');
    LocalStorageService.setJsSdk('sdk');
    LocalStorageService.removeToken();
    expect(LocalStorageService.getJsSdk()).toBe('sdk');
  });

  test('does nothing on the server, where there is no window', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('jssdk', 'sdk');
    vi.stubGlobal('window', undefined);

    expect(LocalStorageService.getToken()).toBeUndefined();
    expect(LocalStorageService.getJsSdk()).toBeUndefined();
    LocalStorageService.setToken('new');
    LocalStorageService.setJsSdk('new');
    LocalStorageService.removeToken();
    LocalStorageService.removeJsSdk();

    expect(localStorage.getItem('token')).toBe('abc');
    expect(localStorage.getItem('jssdk')).toBe('sdk');
  });
});
