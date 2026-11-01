import Head from 'next/head'

export type iHeader = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}
const Header = ({title, description, image, url}: iHeader) => {
  const pageTitle = title || (process.env.NEXT_PUBLIC_APP_NAME || 'SHM');
  const logoUrl = `${process.env.NEXT_PUBLIC_READER_BASE_URL || ''}/logo.png`;
  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description || ''}  />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description || ''} />
      <meta property="og:image" content={(image || logoUrl).replace(/^(https?:)?\/\//, 'https://')} />
      {url ? <meta property="og:url" content={url} /> : null}
      <meta name="twitter:card" content="summary" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

export default Header
