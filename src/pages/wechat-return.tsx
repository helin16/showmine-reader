import { useEffect, useState } from 'react';
import Page from '@/components/Page';
import Page404 from '@/components/Page404';
import CommentService from '@/serivices/CommentService';
import Utils from '@/serivices/Utils';

// Where WeChat sign-in returns to. A full load of the article follows, so WeChat signs its clean address.
const WeChatReturn = () => {
  const [itemPath, setItemPath] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const itemId = query.get('itemId') || '';
    const state = query.get('state') || '';
    const path = itemId === '' ? null : `/item/${encodeURIComponent(itemId)}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address is only known after hydration
    setItemPath(path);
    if (path === null || state === '') {
      setIsDone(true);
      return;
    }
    CommentService.finishSignIn(state)
      .then(() => Utils.goTo(path))
      .catch(() => setIsDone(true));
  }, []);

  if (!isDone) {
    return null;
  }
  return (
    <Page className={'home-page-wrapper'}>
      {itemPath === null ? (
        <Page404 />
      ) : (
        <p className={'text-center'}>
          微信登录未完成。WeChat sign-in did not finish.{' '}
          <a href={itemPath}>返回文章 Back to the article</a>
        </p>
      )}
    </Page>
  );
};

export default WeChatReturn;
