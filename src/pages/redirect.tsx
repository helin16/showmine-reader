import Page404 from '@/components/Page404';
import Page from '@/components/Page';

const Redirect = () => {
  return (
    <Page className={'home-page-wrapper'}>
      <Page404 />
    </Page>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  const { itemId } = query;
  const itemIdString = `${itemId || ''}`.trim();
  if (itemIdString === '') {
    return {
      props: {}
    };
  }

  return {
    redirect: {
      destination: `/item/${itemIdString}`,
      permanent: false
    }
  };
};

export default Redirect;
