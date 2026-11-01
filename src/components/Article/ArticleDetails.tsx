import iItem from '@/types/iItem';
import moment from 'moment';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import WeChatService from '@/serivices/WeChatService';
import ItemService from '@/serivices/ItemService';
import Utils from '@/serivices/Utils';

type iArticleDetails = {
  item: iItem;
  jsConfig?: any;
};

const ArticleDetails = ({ item, jsConfig }: iArticleDetails) => {
  const [isInWeChat, setIsInWeChat] = useState(false);
  const wxRef = useRef<any>(null);

  useEffect(() => {
    setIsInWeChat(WeChatService.isInWeChat());
  }, []);

  useEffect(() => {
    if (isInWeChat !== true) {
      return;
    }
    WeChatService.runWhenWXReady(jsConfig)
      .then(({ wx }) => {
        wxRef.current = wx;
        wx.updateAppMessageShareData({
          type: 'link',
          title: item.title,
          link: WeChatService.getShareItemUrl(item.id),
          imgUrl: ItemService.getCoverImageUrl(item),
          desc: Utils.stripHTMLTags(
            `${item.excerpt || ''}`.trim() === ''
              ? `${item.content || ''}`.trim()
              : `${item.excerpt || ''}`.trim()
          ),
          success: () => {
            console.log('updateAppMessageShareData loaded');
          }
          // cancel: () => {}
        });
        wx.updateTimelineShareData({
          type: 'link',
          title: item.title,
          link: WeChatService.getShareItemUrl(item.id),
          imgUrl: ItemService.getCoverImageUrl(item),
          success: () => {
            console.log('updateTimelineShareData loaded');
          }
          // cancel: () => {}
        });
      })
      .catch(err => {
        console.error(err);
      });
  }, [isInWeChat, item.id]);

  const previewImage = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLImageElement;
    if (!wxRef.current || target.tagName !== 'IMG') {
      return;
    }
    wxRef.current.previewImage({
      current: target.src, // 当前显示图片的http链接
      urls: Array.from(e.currentTarget.querySelectorAll('img')).map(
        img => img.src
      ) // 需要预览的图片http链接列表
    });
  };

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
          id={`article-content-${item.id}`}
          className={'content margin-bottom-md'}
          dangerouslySetInnerHTML={{ __html: item.content || '' }}
          onClick={previewImage}
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
