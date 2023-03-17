import Head from 'next/head'

export type iHeader = {
  title?: string;
  description?: string;
}
const Header = ({title, description}: iHeader) => {
  return (
    <Head>
      <title>{title || (process.env.NEXT_PUBLIC_APP_NAME || 'SHM')}</title>
      <meta name="description" content={description || ''}  />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

export default Header
