import Page from "../../components/Page";
import Header from "../../components/Header";
import ItemService from '@/serivices/ItemService';
import Page404 from '@/components/Page404';
import ArticleDetails from '@/components/ArticleDetails';

const ItemDetailsPage = ({item}: any) => {
  const getContent = () => {
    if (item === undefined) {
      return <Page404 />
    }
    return <ArticleDetails item={item} />
  }

  return (
    <Page header={<Header title={item?.title} description={item?.description}/>}>
      <div>{getContent()}</div>
    </Page>
  )
}

export const getServerSideProps = async ({params}: any) => {
  const {id} = params;
  let item = undefined;
  try {
    item = await ItemService.getItemById(id, {
      include: 'Author,Company.LogoAsset'
    });
  } catch (err) {
    console.error(err);
  }
  return {
    props: {
      item: item,
    },
  }
}

export default ItemDetailsPage;
