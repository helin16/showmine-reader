import { useRouter } from 'next/router'
import Page404 from '@/components/Page404';
import Page from '@/components/Page';
import {useEffect} from 'react';

const redirect = () => {
  const router = useRouter()
  const {itemId} = router.query;
  const itemIdString = `${itemId || ''}`.trim();
  useEffect(() => {
    if (itemIdString === '') { return }
    router.replace(`/item/${itemIdString}`);
  }, [itemIdString])


  if (itemIdString === '') {
    return <Page className={'home-page-wrapper'}><Page404 /></Page>;
  }

  return null;
}

export default redirect;
