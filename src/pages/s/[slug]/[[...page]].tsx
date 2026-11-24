import Head from 'next/head';
import moment from 'moment';
import Header from '@/components/Header';
import Page404 from '@/components/Page404';
import Site from '@/components/Website/Site';
import WebsiteService from '@/serivices/WebsiteService';
import ItemService from '@/serivices/ItemService';
import { OP_LT } from '@/helper/ServiceHelper';
import iItem from '@/types/iItem';
import { iWebsite, iWebsitePage } from '@/types/iWebsite';

// A company's website (showmine-admin specs/001-website-builder, contracts/reader-routes.md).
type iWebsitePageProps = {
  website?: iWebsite;
  page?: iWebsitePage;
  preview?: string;
  articles?: { [sectionId: string]: iItem[] };
  isRateLimited?: boolean;
};

const WebsitePage = ({
  website,
  page,
  preview,
  articles,
  isRateLimited
}: iWebsitePageProps) => {
  if (isRateLimited === true) {
    return (
      <Page404
        title={'Too Many Requests 访问过于频繁'}
        description={
          'Please wait a few minutes and try again. 请等待几分钟后重试。'
        }
      />
    );
  }
  if (!website || !page) {
    return <Page404 />;
  }
  // The page's own, then the site's, then the company's (FR-021).
  const title =
    page.seo?.title ||
    (page.slug === website.pages[0]?.slug ? website.seo?.title : '') ||
    page.title;
  return (
    <>
      <Header
        title={
          title === website.company.name
            ? title
            : `${title} | ${website.company.name}`
        }
        description={page.seo?.description || website.seo?.description || ''}
        image={
          page.seo?.imageUrl || website.seo?.imageUrl || website.company.logoUrl
        }
      />
      {preview ? (
        <Head>
          <meta name={'robots'} content={'noindex'} />
        </Head>
      ) : null}
      <Site
        website={website}
        page={page}
        preview={preview}
        articles={articles || {}}
      />
    </>
  );
};

// An articles section that fails to load is left empty; it never takes the page down.
const loadArticles = async (website: iWebsite, page: iWebsitePage) => {
  const sections = page.sections.filter(section => section.type === 'articles');
  const lists = await Promise.all(
    sections.map(section =>
      ItemService.getAllItemsUnderCompany(website.companyId, {
        perPage: section.count || 3,
        currentPage: 1,
        include: 'CoverAsset',
        sort: 'publishedAt:DESC',
        where: JSON.stringify({
          isActive: true,
          publishedAt: { [OP_LT]: moment().toISOString() }
        }),
        ...(section.tagName ? { tagNames: section.tagName } : {})
      })
        .then(resp => resp.data || [])
        .catch((err: Error) => {
          console.error(err.message);
          return [];
        })
    )
  );
  return Object.fromEntries(
    sections.map((section, index) => [section.id, lists[index]])
  );
};

// Errors are logged by message only: an axios error carries its request headers, including the server key.
export const getServerSideProps = async ({ params, query, res }: any) => {
  const preview =
    typeof query?.preview === 'string' ? query.preview : undefined;
  if (preview !== undefined) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.setHeader('Referrer-Policy', 'no-referrer');
  }
  try {
    const website = await WebsiteService.getPublicWebsite(
      `${params.slug}`,
      preview
    );
    const pageSlug = Array.isArray(params.page)
      ? params.page.join('/')
      : undefined;
    const page =
      pageSlug === undefined
        ? website.pages[0]
        : website.pages.find(p => p.slug === pageSlug);
    if (!page) {
      res.statusCode = 404;
      return { props: {} };
    }
    return {
      props: {
        website,
        page,
        articles: await loadArticles(website, page),
        ...(preview ? { preview } : {})
      }
    };
  } catch (err: any) {
    console.error(err.message);
    // Never a stale copy: every failure but a rate limit shows not-found.
    res.statusCode = err.response?.status === 429 ? 429 : 404;
    return {
      props: err.response?.status === 429 ? { isRateLimited: true } : {}
    };
  }
};

export default WebsitePage;
