
import Header from '@/components/Header';
import Page from '@/components/Page';
import Logo from '@/components/Logo';


const HomePage = () => {
  return (
    <Page header={<Header />} className={'home-page-wrapper'}>
      <Logo
        className={'logo'}
        width={220}
        height={220}
        priority
      />
      <p>{process.env.NEXT_PUBLIC_APP_NAME || 'SHM'}</p>
      <div className={'padding-around-sm'}>
        <a className={'weui-btn weui-btn_primary'} href={process.env.NEXT_PUBLIC_MARKETING_SITE_URL}>
          Back to Home 首页
        </a>
      </div>
    </Page>
  )
}
export default HomePage
