import WebsitePage from '@/pages/s/[slug]/[[...page]]';
import WebsiteService from '@/serivices/WebsiteService';
import { iWebsite } from '@/types/iWebsite';

// A template's full preview with sample content (showmine-admin specs/001-website-builder, US4, R7), opened from the
// admin's gallery in a new tab. Rendered by the public website page; never indexed or cached.
export const getServerSideProps = async ({ params, res }: any) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  try {
    const id = `${params.id}`;
    const { template, company, pages } =
      await WebsiteService.getPublicTemplate(id);
    const website: iWebsite = {
      version: 1,
      slug: template.id,
      basePath: `/t/${template.id}`,
      // No company: articles sections stay empty.
      companyId: '',
      isPreview: true,
      theme: template.theme,
      seo: {},
      company,
      pages
    };
    const pageSlug = Array.isArray(params.page)
      ? params.page.join('/')
      : undefined;
    const page =
      pageSlug === undefined ? pages[0] : pages.find(p => p.slug === pageSlug);
    if (!page) {
      res.statusCode = 404;
      return { props: {} };
    }
    return { props: { website, page, articles: {} } };
  } catch (err: any) {
    // By message only: an axios error carries its request headers.
    console.error(err.message);
    res.statusCode = err.response?.status === 429 ? 429 : 404;
    return {
      props: err.response?.status === 429 ? { isRateLimited: true } : {}
    };
  }
};

export default WebsitePage;
