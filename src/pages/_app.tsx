import '@/styles/globals.scss';
import '@/styles/article.scss';
import '@/styles/spinner.scss';
import '@/styles/itemList.scss';

import type { AppProps } from 'next/app';
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
