import Page from '../../components/Page';
import Header from '../../components/Header';
import ItemService from '@/serivices/ItemService';
import Page404 from '@/components/Page404';
import ArticleDetails from '@/components/Article/ArticleDetails';
import ItemListUnderCompany from '@/components/Item/ItemListUnderCompany';
import ArticleFooter from '@/components/Article/ArticleFooter';

const ItemDetailsPage = ({ item }: any) => {
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
        <ArticleDetails item={item} />
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
  try {
    item = await ItemService.getItemById(id, {
      include: 'CoverAsset,Author,Company.LogoAsset',
      isVisit: '1'
    });
  } catch (err) {
    console.error(err);
  }
  return {
    props: {
      item: item || {}
    }
  };
};

export default ItemDetailsPage;
