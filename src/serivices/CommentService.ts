import AppService from '@/serivices/AppService';
import LocalStorageService from '@/serivices/LocalStorageService';
import iComment from '@/types/iComment';

const endPoint = '/publicComment';

const getAll = (itemId: string): Promise<iComment[]> =>
  AppService.get(`${endPoint}/${itemId}`).then(resp => resp.data);

// The only call with a user's token. On every call, a member of the company would see its drafts in the article list.
const create = (itemId: string, comments: string): Promise<iComment> =>
  AppService.post(
    `${endPoint}/${itemId}`,
    { comments },
    {
      headers: {
        Authorization: `Bearer ${LocalStorageService.getCommentToken()}`
      }
    }
  ).then(resp => resp.data);

// WeChat comes back with ?state= added. An article's WeChat config is signed for its address without that, so sign-in
// returns to a page of its own, which then opens the article.
const getSignInUrl = (itemId: string): Promise<string> =>
  AppService.get('/weChat/auth/authUrl', {
    uiUrl: `${window.location.origin}/wechat-return?itemId=${encodeURIComponent(itemId)}`
  }).then(resp => resp.data.url);

const finishSignIn = async (state: string) => {
  const { token } = (await AppService.get('/weChat/auth/getUser', { token: state })).data;
  if (!token) {
    throw new Error('WeChat sign-in did not finish.');
  }
  LocalStorageService.setCommentToken(token);
};

const CommentService = {
  getAll,
  create,
  getSignInUrl,
  finishSignIn
};

export default CommentService;
