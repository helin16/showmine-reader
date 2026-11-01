import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ArticleComments from '@/components/Article/ArticleComments';
import CommentService from '@/serivices/CommentService';
import LocalStorageService from '@/serivices/LocalStorageService';
import Utils from '@/serivices/Utils';
import WeChatService from '@/serivices/WeChatService';

vi.mock('@/serivices/CommentService', () => ({
  default: { getAll: vi.fn(), create: vi.fn(), getSignInUrl: vi.fn() }
}));
vi.mock('@/serivices/WeChatService', () => ({
  default: { isInWeChat: vi.fn() }
}));

const comment = {
  id: 'c1',
  text: 'Nice post',
  createdAt: '2024-03-15T09:30:00.000Z',
  authorName: 'Ann',
  authorAvatarUrl: null,
  replies: [
    {
      id: 'r1',
      text: 'Thanks',
      createdAt: '2024-03-15T10:30:00.000Z',
      authorName: 'Staff',
      authorAvatarUrl: 'https://cdn.example/a.png'
    }
  ]
};
const httpError = (status: number) => Object.assign(new Error('no'), { response: { status } });
const box = () => screen.getByRole('textbox', { name: /发表评论/ });
const send = () => fireEvent.click(screen.getByRole('button', { name: /发送/ }));

describe('ArticleComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(CommentService.getAll).mockResolvedValue([comment] as any);
    vi.mocked(WeChatService.isInWeChat).mockReturnValue(true);
  });

  describe('reading', () => {
    test('an anonymous reader sees comments and replies', async () => {
      render(<ArticleComments itemId="a" />);
      expect(await screen.findByText('Nice post')).toBeInTheDocument();
      expect(screen.getByText('Ann')).toBeInTheDocument();
      expect(screen.getByText('Thanks')).toBeInTheDocument();
      expect(CommentService.getAll).toHaveBeenCalledWith('a');
    });

    test('shows text as text, so nothing in a comment can run', async () => {
      const stored = '<img src=x onerror="window.hacked = 1">';
      vi.mocked(CommentService.getAll).mockResolvedValue([{ ...comment, text: stored }] as any);
      const { container } = render(<ArticleComments itemId="a" />);

      expect(await screen.findByText(stored)).toBeInTheDocument();
      expect(container.querySelector('img[src="x"]')).not.toBeInTheDocument();
    });

    test('names someone without a nickname', async () => {
      vi.mocked(CommentService.getAll).mockResolvedValue([{ ...comment, authorName: '', replies: [] }] as any);
      render(<ArticleComments itemId="a" />);
      expect(await screen.findByText('微信用户')).toBeInTheDocument();
    });

    test('says when there are none', async () => {
      vi.mocked(CommentService.getAll).mockResolvedValue([]);
      render(<ArticleComments itemId="a" />);
      expect(await screen.findByText(/暂无评论/)).toBeInTheDocument();
    });

    test('a failed load leaves a note, and the page keeps working', async () => {
      vi.mocked(CommentService.getAll).mockRejectedValue(new Error('down'));
      render(<ArticleComments itemId="a" />);
      expect(await screen.findByText(/暂时无法加载/)).toBeInTheDocument();
    });
  });

  describe('signing in', () => {
    test('a reader in WeChat gets a button, and the hint to follow the account', async () => {
      vi.mocked(CommentService.getSignInUrl).mockResolvedValue('https://wechat.example/auth');
      const goTo = vi.spyOn(Utils, 'goTo').mockImplementation(() => undefined);
      render(<ArticleComments itemId="a" />);
      await screen.findByText('Nice post');

      expect(screen.getByText(/关注服务号/)).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /微信登录/ }));

      await waitFor(() => expect(goTo).toHaveBeenCalledWith('https://wechat.example/auth'));
      expect(CommentService.getSignInUrl).toHaveBeenCalledWith('a');
    });

    test('a failed sign-in says so', async () => {
      vi.mocked(CommentService.getSignInUrl).mockRejectedValue(new Error('down'));
      render(<ArticleComments itemId="a" />);
      await screen.findByText('Nice post');
      fireEvent.click(screen.getByRole('button', { name: /微信登录/ }));
      expect(await screen.findByText(/登录失败/)).toBeInTheDocument();
    });

    test('outside WeChat, says where to comment', async () => {
      vi.mocked(WeChatService.isInWeChat).mockReturnValue(false);
      render(<ArticleComments itemId="a" />);
      await screen.findByText('Nice post');

      expect(screen.getByText(/请在微信中打开/)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('commenting', () => {
    beforeEach(() => LocalStorageService.setCommentToken('tok'));

    test('adds the new comment on top and clears the form', async () => {
      vi.mocked(CommentService.create).mockResolvedValue({ ...comment, id: 'c2', text: 'Mine', replies: [] } as any);
      render(<ArticleComments itemId="a" />);
      await screen.findByText('Nice post');

      fireEvent.change(box(), { target: { value: '  Mine  ' } });
      send();

      const mine = await screen.findByText('Mine', { selector: '.comment-text' });
      expect(mine.compareDocumentPosition(screen.getByText('Nice post'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(CommentService.create).toHaveBeenCalledWith('a', 'Mine');
      expect(box()).toHaveValue('');
    });

    test('shows the hint to follow the account here too', async () => {
      render(<ArticleComments itemId="a" />);
      await screen.findByText('Nice post');
      expect(screen.getByText(/关注服务号/)).toBeInTheDocument();
    });

    test('sends nothing empty, and nothing twice', async () => {
      vi.mocked(CommentService.create).mockReturnValue(new Promise(() => undefined));
      render(<ArticleComments itemId="a" />);
      await screen.findByText('Nice post');

      send();
      expect(CommentService.create).not.toHaveBeenCalled();

      fireEvent.change(box(), { target: { value: 'Mine' } });
      send();
      await waitFor(() => expect(screen.getByRole('button', { name: /发送/ })).toBeDisabled());
      expect(CommentService.create).toHaveBeenCalledTimes(1);
    });

    test.each([[401], [403]])('a %i asks to sign in again, as the token is no use', async (status) => {
      vi.mocked(CommentService.create).mockRejectedValue(httpError(status));
      render(<ArticleComments itemId="a" />);
      await screen.findByText('Nice post');
      fireEvent.change(box(), { target: { value: 'Mine' } });
      send();

      expect(await screen.findByRole('button', { name: /微信登录/ })).toBeInTheDocument();
      expect(LocalStorageService.getCommentToken()).toBeNull();
    });

    test.each([
      [429, /太频繁/],
      [500, /发送失败/]
    ])('a %i says so, and keeps what was typed', async (status, text) => {
      vi.mocked(CommentService.create).mockRejectedValue(httpError(status));
      render(<ArticleComments itemId="a" />);
      await screen.findByText('Nice post');
      fireEvent.change(box(), { target: { value: 'Mine' } });
      send();

      expect(await screen.findByText(text)).toBeInTheDocument();
      expect(box()).toHaveValue('Mine');
    });
  });
});
