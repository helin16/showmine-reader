import iItem from '@/types/iItem';
import ArticleFooter from '@/components/ArticleFooter';
import moment from 'moment';

type iArticleDetails = {
  item: iItem;
}

const ArticleDetails = ({item}: iArticleDetails) => {
  const getAuthorUrl = () => {
    const pattern = /^((http|https|ftp):\/\/)/;
    const url = `${item.Author?.url || ''}`.trim();
    if(pattern.test(url)) {
      return url;
    }
    return `http://${url}`;
  }
  return (
    <div className={'article-details-wrapper'}>
      <div className={'header margin-bottom-md'}>
        <div className={'title'}>{item.title}</div>
        <div className={'info'}>
          <div className={'left'}>
            <a className={'author'} href={getAuthorUrl()}>{item.Author?.name}</a>
            <div className={'text-muted'}>{moment(item.publishedAt).format('YYYY-MM-DD HH:mm')}</div>
          </div>
          <div className={'right text-muted'}>
            阅读: {item.noOfVisits}
          </div>
        </div>
      </div>
      <div className={'content-wrapper'}>
        {/*// @ts-ignore*/}
        <div className={'content margin-bottom-md'} dangerouslySetInnerHTML={{ __html: item.content || '' }} />
        <div className={'article-end text-muted text-center'}>
          <small>- END -</small>
        </div>
        {/*// @ts-ignore*/}
        <div className={'default-footer margin-bottom-md'} dangerouslySetInnerHTML={{ __html: item.itemDefaultFooter || '' }} />
      </div>
      <ArticleFooter company={item.Company} />
    </div>
  );
}

export default ArticleDetails;
