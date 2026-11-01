import moment from 'moment';
import { FormEvent, useEffect, useState } from 'react';
import CommentService from '@/serivices/CommentService';
import LocalStorageService from '@/serivices/LocalStorageService';
import Utils from '@/serivices/Utils';
import WeChatService from '@/serivices/WeChatService';
import iComment from '@/types/iComment';

const MAX_LENGTH = 1000;

const CommentRow = ({ comment }: { comment: iComment }) => (
  <div className={'comment'}>
    <div className={'comment-author'}>
      {comment.authorAvatarUrl ? (
        <img className={'avatar'} src={comment.authorAvatarUrl} alt={''} />
      ) : null}
      <span>{comment.authorName || '微信用户'}</span>
      <small className={'text-muted'}>
        {moment(comment.createdAt).format('YYYY-MM-DD HH:mm')}
      </small>
    </div>
    <div className={'comment-text'}>{comment.text}</div>
    {(comment.replies || []).map(reply => (
      <div className={'comment-reply'} key={reply.id}>
        <CommentRow comment={reply} />
      </div>
    ))}
  </div>
);

const FollowHint = () => (
  <small className={'text-muted'}>
    关注服务号即可收到回复通知。Follow our WeChat service account to receive
    replies.
  </small>
);

// Loaded in the browser, not with the page: an article must still open when these calls fail.
const ArticleComments = ({ itemId }: { itemId: string }) => {
  const [comments, setComments] = useState<iComment[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isInWeChat, setIsInWeChat] = useState(false);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- both are only known after hydration
    setIsSignedIn(!!LocalStorageService.getCommentToken());
    setIsInWeChat(WeChatService.isInWeChat());
    let isCancelled = false;
    CommentService.getAll(itemId)
      .then(list => {
        if (!isCancelled) {
          setComments(list);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLoadFailed(true);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [itemId]);

  const signIn = () => {
    setNotice('');
    CommentService.getSignInUrl(itemId)
      .then(Utils.goTo)
      .catch(() => setNotice('微信登录失败，请重试。WeChat sign-in failed.'));
  };

  const onSendFailed = (status?: number) => {
    if (status === 401 || status === 403) {
      LocalStorageService.removeCommentToken();
      setIsSignedIn(false);
      setNotice('请重新登录。Please sign in again.');
    } else if (status === 429) {
      setNotice('评论太频繁，请稍后再试。Too many comments. Please wait.');
    } else {
      setNotice('发送失败，请重试。Sending failed. Please try again.');
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const typed = text.trim();
    if (typed === '') {
      return;
    }
    setIsSending(true);
    setNotice('');
    try {
      const comment = await CommentService.create(itemId, typed);
      setComments(list => [comment, ...(list || [])]);
      setText('');
    } catch (err: any) {
      onSendFailed(err.response?.status);
    } finally {
      setIsSending(false);
    }
  };

  const getList = () => {
    if (loadFailed) {
      return (
        <p className={'text-muted'}>
          评论暂时无法加载。Comments cannot load right now.
        </p>
      );
    }
    if (comments === null) {
      return null;
    }
    if (comments.length === 0) {
      return <p className={'text-muted'}>暂无评论。No comments yet.</p>;
    }
    return comments.map(comment => (
      <CommentRow comment={comment} key={comment.id} />
    ));
  };

  const getForm = () => {
    if (isSignedIn) {
      return (
        <form onSubmit={send}>
          <textarea
            aria-label={'发表评论 Add a comment'}
            placeholder={'发表评论 Add a comment'}
            rows={3}
            maxLength={MAX_LENGTH}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button type={'submit'} disabled={isSending}>
            发送 Send
          </button>
          <FollowHint />
        </form>
      );
    }
    if (isInWeChat) {
      return (
        <>
          <button type={'button'} onClick={signIn}>
            微信登录后评论 Sign in with WeChat to comment
          </button>
          <FollowHint />
        </>
      );
    }
    return (
      <p className={'text-muted'}>
        请在微信中打开本页以发表评论。Open this page in WeChat to comment.
      </p>
    );
  };

  return (
    <section className={'article-comments'}>
      <div className={'comments-title'}>评论 Comments</div>
      {getList()}
      <div className={'comment-form'}>
        {getForm()}
        {notice === '' ? null : <p role={'status'}>{notice}</p>}
      </div>
    </section>
  );
};

export default ArticleComments;
