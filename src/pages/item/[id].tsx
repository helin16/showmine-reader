import Page from '../../components/Page';
import Header from '../../components/Header';
import ItemService from '@/serivices/ItemService';
import Page404 from '@/components/Page404';
import ArticleDetails from '@/components/Article/ArticleDetails';
import ArticleFooter from '@/components/Article/ArticleFooter';
import WeChatService from '@/serivices/WeChatService';

const ItemDetailsPage = ({ item, wxJsSdKObj }: any) => {
  const getContent = () => {
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
        <ArticleDetails item={item} wxJsSdKObj={wxJsSdKObj} />
        <ArticleFooter company={item.Company} />
      </>
    );
  };

  return (
    <Page
      header={<Header title={item?.title} description={item?.description} />}
    >
      <div>{getContent()}</div>
    </Page>
  );
};

export const getServerSideProps = async ({ params }: any) => {
  const { id } = params;
  let item = undefined;
  let wxJsSdKObj = {};
  try {
    const [itemRes, wxJsSdKRes] = await Promise.all([
      ItemService.getItemById(id, {
        include: 'Author,Company.LogoAsset',
        isVisit: '1'
      }),
      WeChatService.getWeChatJsConfig(
        process.env.NEXT_PUBLIC_READER_BASE_URL || ''
      )
    ]);
    item = itemRes;
    wxJsSdKObj = wxJsSdKRes;
  } catch (err) {
    console.error(err);
  }
  return {
    props: {
      item,
      wxJsSdKObj
    }
  };
};

export default ItemDetailsPage;
