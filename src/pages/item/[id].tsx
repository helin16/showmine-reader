import Page from '../../components/Page';
import Header from '../../components/Header';
import ItemService from '@/serivices/ItemService';
import Page404 from '@/components/Page404';
import ArticleComments from '@/components/Article/ArticleComments';
import ArticleDetails from '@/components/Article/ArticleDetails';
import ArticleFooter from '@/components/Article/ArticleFooter';
import weChatService from '@/serivices/WeChatService';
import GTranslator from '@/components/GTranslator';

// The API may never answer during a WeChat outage; the client retries for itself.
const WE_CHAT_CONFIG_TIMEOUT_MS = 3000;

const ItemDetailsPage = ({ item, config, isRateLimited }: any) => {
  const getContent = () => {
    if (isRateLimited === true) {
      return (
        <Page404
          title={'Too Many Requests 访问过于频繁'}
          description={
            'Please wait a few minutes and try again. 请等待几分钟后重试。'
          }
        />
      );
    }
    if (item === undefined) {
      return <Page404 />;
    }
    if (item.isPublished !== true) {
      return (
        <Page404
          title={'Item Not Available 文章无法访问'}
          description={
            'Visiting item is not Available. 文章可能是还没有被发布或者已下架。'
          }
        />
      );
    }
    return (
      <>
        <ArticleDetails item={item} jsConfig={config} />
        {item.enableCommentsFlag === true ? (
          <ArticleComments itemId={item.id} />
        ) : null}
        <ArticleFooter company={item.Company} />
      </>
    );
  };

  return (
    <Page
      header={<Header title={item?.title} description={item?.description} />}
    >
      {item.enableGTranslateFlag === true ? <GTranslator /> : null}
      <div>{getContent()}</div>
    </Page>
  );
};

// Errors are logged by message only: an axios error carries its request headers, including the server key.
export const getServerSideProps = async ({ params, res }: any) => {
  const { id } = params;
  let item = undefined;
  let config = null;
  try {
    const [itemDetails, configObj] = await Promise.all([
      ItemService.getItemById(id, {
        include: 'CoverAsset,Author,Company.LogoAsset',
        isVisit: '1'
      }),
      weChatService
        .getWeChatJsConfig(weChatService.getItemCurrentUrl(id), undefined, {
          timeout: WE_CHAT_CONFIG_TIMEOUT_MS
        })
        .catch(err => {
          console.error(err.message);
          return null;
        })
    ]);
    item = itemDetails;
    config = configObj;
  } catch (err: any) {
    console.error(err.message);
    if (err.response?.status === 429) {
      res.statusCode = 429;
      return { props: { item: {}, config: null, isRateLimited: true } };
    }
  }
  return {
    props: {
      item: item || {},
      config
    }
  };
};

export default ItemDetailsPage;
