import AppService from '@/serivices/AppService';
import { iWebsite } from '@/types/iWebsite';

const getPublicWebsite = (slug: string, preview?: string): Promise<iWebsite> =>
  AppService.get(
    `/publicWebsite/${encodeURIComponent(slug)}`,
    preview === undefined ? undefined : { preview }
  ).then(resp => resp.data);

// A template with sample content (GET /publicTemplate/:id).
const getPublicTemplate = (
  id: string
): Promise<{
  template: { id: string; theme?: iWebsite['theme'] };
  company: iWebsite['company'];
  pages: iWebsite['pages'];
}> =>
  AppService.get(`/publicTemplate/${encodeURIComponent(id)}`).then(
    resp => resp.data
  );

const getBasePath = (website: Pick<iWebsite, 'slug' | 'basePath'>) =>
  website.basePath || `/s/${website.slug}`;

// Where a section link goes: a page of the same site, or a web, email or phone address. Anything else is dropped.
const getHref = (
  website: Pick<iWebsite, 'slug' | 'basePath'>,
  link: unknown,
  preview?: string
) => {
  if (typeof link !== 'string') {
    return undefined;
  }
  if (/^\/[a-z0-9-]{1,40}$/.test(link)) {
    const href = `${getBasePath(website)}${link}`;
    return preview ? `${href}?preview=${encodeURIComponent(preview)}` : href;
  }
  return /^(https?:\/\/|mailto:|tel:)/i.test(link) ? link : undefined;
};

// A page of the site; the first is the home page, at the base path itself.
const getPageHref = (website: iWebsite, index: number, preview?: string) => {
  const href = getHref(website, `/${website.pages[index]?.slug}`, preview);
  return index === 0 && href
    ? href.replace(
        `${getBasePath(website)}/${website.pages[0].slug}`,
        getBasePath(website)
      )
    : href;
};

const WebsiteService = {
  getPublicWebsite,
  getPublicTemplate,
  getHref,
  getPageHref
};

export default WebsiteService;
