import { useRouter } from 'next/router'
import Page404 from '@/components/Page404';
import Page from '@/components/Page';
import {useEffect} from 'react';

const Redirect = () => {
  const router = useRouter()
  const {itemId} = router.query;
  const itemIdString = `${itemId || ''}`.trim();

  useEffect(() => {
    if(itemIdString !== '') {
      router.replace(`/item/${itemIdString}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdString])

  if (itemIdString === '') {
    return <Page className={'home-page-wrapper'}><Page404 /></Page>;
  }

  return <div>redirecting...</div>;
}

export default Redirect;
