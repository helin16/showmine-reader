import AppService from '@/serivices/AppService';
import { iWebsite } from '@/types/iWebsite';

const getPublicWebsite = (slug: string, preview?: string): Promise<iWebsite> =>
  AppService.get(
    `/publicWebsite/${encodeURIComponent(slug)}`,
    preview === undefined ? undefined : { preview }
  ).then(resp => resp.data);

// Where a section link goes: a page of the same site, or a web, email or phone address. Anything else is dropped.
const getHref = (siteSlug: string, link: unknown, preview?: string) => {
  if (typeof link !== 'string') {
    return undefined;
  }
  if (/^\/[a-z0-9-]{1,40}$/.test(link)) {
    const href = `/s/${siteSlug}${link}`;
    return preview ? `${href}?preview=${encodeURIComponent(preview)}` : href;
  }
  return /^(https?:\/\/|mailto:|tel:)/i.test(link) ? link : undefined;
};

// A page of the site; the first is the home page, at /s/<slug> itself.
const getPageHref = (website: iWebsite, index: number, preview?: string) => {
  const href = getHref(website.slug, `/${website.pages[index]?.slug}`, preview);
  return index === 0 && href
    ? href.replace(
        `/s/${website.slug}/${website.pages[0].slug}`,
        `/s/${website.slug}`
      )
    : href;
};

const WebsiteService = { getPublicWebsite, getHref, getPageHref };

export default WebsiteService;
