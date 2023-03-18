import Logo from '@/components/Logo';

type iPage404 = {
  title?: string;
  description?: string;
}
const Page404 = ({description, title}: iPage404) => {
  return (
    <div className={'page404 text-center'}>
      <Logo
        className={'logo'}
        width={120}
        height={120}
        priority
      />
      <h4 className={'title'}>{title || '404 走丢了'}</h4>
      <p className={'description'}>{description || `Opps, can't find the page. 找不到您要的页面了`}</p>
      <div className={'padding-around-sm'}>
        <a className={'weui-btn weui-btn_primary'} href={process.env.NEXT_PUBLIC_MARKETING_SITE_URL}>
          Back to Home 首页
        </a>
      </div>
    </div>
  )
}

export default Page404;
