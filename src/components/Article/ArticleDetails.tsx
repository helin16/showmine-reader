import iItem from '@/types/iItem';
import moment from 'moment';
import { useEffect, useState } from 'react';
import WeChatService from '@/serivices/WeChatService';
import ItemService from '@/serivices/ItemService';
import Utils from '@/serivices/Utils';
import Spinner from '@/components/Spinner';

type iArticleDetails = {
  item: iItem;
};

const ArticleDetails = ({ item }: iArticleDetails) => {
  const [isInWeChat, setIsInWeChat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsInWeChat(WeChatService.isInWeChat());
  }, []);

  useEffect(() => {
    if (isInWeChat !== true) {
      return;
    }
    setIsLoading(true);
    WeChatService.runWhenWXReady()
      .then(({ xw }) => {
        console.log('artcile details xw', xw);
        xw.updateAppMessageShareData({
          type: 'link',
          title: item.title,
          link: WeChatService.getShareItemUrl(item.id),
          imgUrl: ItemService.getCoverImageUrl(item),
          desc: Utils.stripHTMLTags(item.excerpt || ''),
          success: () => {
            alert('Shared Successfully.分享成功');
          }
          // cancel: () => {}
        });
        xw.updateTimelineShareData({
          type: 'link',
          title: item.title,
          link: WeChatService.getShareItemUrl(item.id),
          imgUrl: ItemService.getCoverImageUrl(item),
          success: () => {
            alert('Shared Successfully.分享成功');
          }
          // success: () => {},
          // cancel: () => {}
        });
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isInWeChat]);

  const getAuthorUrl = () => {
    const url = `${item.Author?.url || ''}`.trim();
    if (url === '') {
      return '';
    }
    const pattern = /^((http|https|ftp):\/\/)/;
    if (pattern.test(url)) {
      return url;
    }
    return `http://${url}`;
  };

  const getAuthorDiv = () => {
    const authorName = `${item.Author?.name || ''}`.trim();
    if (authorName === '') {
      return null;
    }
    const authorUrl = getAuthorUrl();
    if (authorUrl === '') {
      return <span className={'author'}>{authorName}</span>;
    }
    return (
      <a className={'author'} href={authorUrl}>
        {item.Author?.name}
      </a>
    );
  };

  const getItemFooter = () => {
    const footerString = `${item.Company?.itemDefaultFooter || ''}`.trim();
    if (footerString === '') {
      return null;
    }
    return (
      <div
        className={'default-footer margin-bottom-md'}
        dangerouslySetInnerHTML={{ __html: footerString }}
      />
    );
  };

  if (isLoading === true) {
    return <Spinner />;
  }

  return (
    <div className={'article-details-wrapper'}>
      <div className={'header margin-bottom-md'}>
        <div className={'title'}>{item.title}</div>
        <div className={'info'}>
          <div className={'left'}>
            {getAuthorDiv()}
            <div className={'text-muted'}>
              {moment(item.publishedAt).format('YYYY-MM-DD HH:mm')}
            </div>
          </div>
          <div className={'right text-muted'}>阅读: {item.noOfVisits}</div>
        </div>
      </div>
      <div className={'content-wrapper'}>
        {/*// @ts-ignore*/}
        <div
          className={'content margin-bottom-md'}
          dangerouslySetInnerHTML={{ __html: item.content || '' }}
        />
        <div className={'article-end text-muted text-center'}>
          <small>- END -</small>
        </div>
        {getItemFooter()}
      </div>
    </div>
  );
};

export default ArticleDetails;
