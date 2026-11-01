import { beforeEach, describe, expect, test, vi } from 'vitest';
import AppService from '@/serivices/AppService';
import CommentService from '@/serivices/CommentService';
import LocalStorageService from '@/serivices/LocalStorageService';

vi.mock('@/serivices/AppService', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}));

describe('CommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('reads without any sign-in', async () => {
    vi.mocked(AppService.get).mockResolvedValue({ data: [{ id: 'c1' }] } as any);
    expect(await CommentService.getAll('a')).toStrictEqual([{ id: 'c1' }]);
    expect(AppService.get).toHaveBeenCalledWith('/publicComment/a');
  });

  test('creates with the comment token, which only this call sends', async () => {
    LocalStorageService.setCommentToken('tok');
    vi.mocked(AppService.post).mockResolvedValue({ data: { id: 'c1' } } as any);

    expect(await CommentService.create('a', 'hello')).toStrictEqual({ id: 'c1' });

    expect(AppService.post).toHaveBeenCalledWith(
      '/publicComment/a',
      { comments: 'hello' },
      { headers: { Authorization: 'Bearer tok' } }
    );
  });

  test('sign-in comes back to a page of its own, because an article page signs its clean address', async () => {
    vi.mocked(AppService.get).mockResolvedValue({ data: { url: 'https://wechat.example' } } as any);

    expect(await CommentService.getSignInUrl('a/b')).toBe('https://wechat.example');

    expect(AppService.get).toHaveBeenCalledWith('/weChat/auth/authUrl', {
      uiUrl: `${window.location.origin}/wechat-return?itemId=a%2Fb`
    });
  });

  test('finishing sign-in keeps the token', async () => {
    vi.mocked(AppService.get).mockResolvedValue({ data: { token: 'tok', user: {} } } as any);

    await CommentService.finishSignIn('state-1');

    expect(AppService.get).toHaveBeenCalledWith('/weChat/auth/getUser', { token: 'state-1' });
    expect(LocalStorageService.getCommentToken()).toBe('tok');
  });

  test('finishing without a token fails', async () => {
    vi.mocked(AppService.get).mockResolvedValue({ data: { id: 'state-1' } } as any);
    await expect(CommentService.finishSignIn('state-1')).rejects.toThrow();
    expect(LocalStorageService.getCommentToken()).toBeNull();
  });
});
