import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import WeChatReturn from '@/pages/wechat-return';
import CommentService from '@/serivices/CommentService';
import Utils from '@/serivices/Utils';

vi.mock('@/serivices/CommentService', () => ({
  default: { finishSignIn: vi.fn() }
}));

describe('WeChat sign-in return page', () => {
  let goTo: any;

  const visit = (query: string) => {
    window.history.replaceState({}, '', `/wechat-return${query}`);
    return render(<WeChatReturn />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    goTo = vi.spyOn(Utils, 'goTo').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  test('keeps the sign-in and goes back to a clean article address', async () => {
    vi.mocked(CommentService.finishSignIn).mockResolvedValue(undefined);
    visit('?itemId=a&state=s1');

    await waitFor(() => expect(goTo).toHaveBeenCalledWith('/item/a'));
    expect(CommentService.finishSignIn).toHaveBeenCalledWith('s1');
  });

  test.each([['https://evil.example'], ['//evil.example'], ['../../evil']])(
    'stays inside the item route for %s',
    async itemId => {
      vi.mocked(CommentService.finishSignIn).mockResolvedValue(undefined);
      visit(`?state=s1&itemId=${encodeURIComponent(itemId)}`);
      await waitFor(() => expect(goTo).toHaveBeenCalledWith(`/item/${encodeURIComponent(itemId)}`));
    }
  );

  test('a failed sign-in offers the way back', async () => {
    vi.mocked(CommentService.finishSignIn).mockRejectedValue(new Error('expired'));
    visit('?itemId=a&state=s1');

    expect(await screen.findByRole('link', { name: /返回文章/ })).toHaveAttribute('href', '/item/a');
    expect(goTo).not.toHaveBeenCalled();
  });

  test('someone who declined goes through the same way', async () => {
    visit('?itemId=a&wechatError=declined');

    expect(await screen.findByRole('link', { name: /返回文章/ })).toBeInTheDocument();
    expect(CommentService.finishSignIn).not.toHaveBeenCalled();
  });

  test('without an article, there is nowhere to go back to', async () => {
    visit('?state=s1');

    expect(await screen.findByRole('heading')).toHaveTextContent('404');
    expect(CommentService.finishSignIn).not.toHaveBeenCalled();
  });
});
