
import Header from '@/components/Header';
import Page from '@/components/Page';
import Page404 from '@/components/Page404';


const HomePage = () => {
  return (
    <Page header={<Header />} className={'home-page-wrapper'}>
      <Page404 />
    </Page>
  )
}
export default HomePage
