import { useRouter } from 'next/router'
import Page404 from '@/components/Page404';
import Page from '@/components/Page';

const redirect = () => {
  const router = useRouter()
  const {itemId} = router.query;
  const itemIdString = `${itemId || ''}`.trim();

  if (itemIdString === '') {
    return <Page className={'home-page-wrapper'}><Page404 /></Page>;
  }
  router.replace(`/item/${itemId}`);
  return null;
}

export default redirect;
