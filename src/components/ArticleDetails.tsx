import iItem from '@/types/iItem';

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
        <div>
          <a className={'text-muted padding-around-sm'} href={getAuthorUrl()}>{item.Author?.name}</a>
        </div>
      </div>
      {/*// @ts-ignore*/}
      <div className={'content margin-bottom-md'} dangerouslySetInnerHTML={{ __html: item.content }} />
      <div className={'article-end text-muted text-center'}>
        <small>The End - 文章底部</small>
      </div>
    </div>
  );
}

export default ArticleDetails;
