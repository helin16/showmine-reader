import { iWebsite } from '@/types/iWebsite';
import WebsiteService from '@/serivices/WebsiteService';

type iNav = { website: iWebsite; currentSlug: string; preview?: string };

// The first page is the home page, at /s/<site>.
const Nav = ({ website, currentSlug, preview }: iNav) => (
  <nav className={'site-nav'} aria-label={'Pages'}>
    <a
      className={'site-name'}
      href={WebsiteService.getPageHref(website, 0, preview)}
    >
      {website.company.logoUrl ? (
        <img src={website.company.logoUrl} alt={''} />
      ) : null}
      <span>{website.company.name}</span>
    </a>
    <ul>
      {website.pages.map((page, index) => (
        <li key={page.slug}>
          <a
            href={WebsiteService.getPageHref(website, index, preview)}
            aria-current={page.slug === currentSlug ? 'page' : undefined}
          >
            {page.title}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

export default Nav;
