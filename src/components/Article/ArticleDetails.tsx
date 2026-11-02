import iItem from '@/types/iItem';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import WeChatService from '@/serivices/WeChatService';
import ItemService from '@/serivices/ItemService';
import ArticleDate from './ArticleDate';
import VideoCoverService, {
  COVER_IMAGE_CLASS
} from '@/serivices/VideoCoverService';

type iArticleDetails = {
  item: iItem;
  jsConfig?: any;
};

const ArticleDetails = ({ item, jsConfig }: iArticleDetails) => {
  const [isInWeChat, setIsInWeChat] = useState(false);
  const wxRef = useRef<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the user agent is only known after hydration
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
          desc: ItemService.getShareDescription(item),
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

  useEffect(
    () => VideoCoverService.setup(contentRef.current as HTMLDivElement),
    [item.id, item.content]
  );

  const previewImage = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLImageElement;
    if (
      !wxRef.current ||
      target.tagName !== 'IMG' ||
      target.classList.contains(COVER_IMAGE_CLASS)
    ) {
      return;
    }
    wxRef.current.previewImage({
      current: target.src, // 当前显示图片的http链接
      urls: Array.from(
        e.currentTarget.querySelectorAll<HTMLImageElement>(
          `img:not(.${COVER_IMAGE_CLASS})`
        )
      ).map(img => img.src) // 需要预览的图片http链接列表
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
              <ArticleDate value={item.publishedAt} />
            </div>
          </div>
          <div className={'right text-muted'}>阅读: {item.noOfVisits}</div>
        </div>
      </div>
      <div className={'content-wrapper'}>
        {/*// @ts-ignore*/}
        <div
          id={`article-content-${item.id}`}
          ref={contentRef}
          className={'content margin-bottom-md'}
          dangerouslySetInnerHTML={{
            __html: ItemService.prepareVideoHtml(item.content || '')
          }}
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
