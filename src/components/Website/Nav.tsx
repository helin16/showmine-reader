import { useState } from 'react';
import { iWebsite } from '@/types/iWebsite';
import WebsiteService from '@/serivices/WebsiteService';

type iNav = { website: iWebsite; currentSlug: string; preview?: string };

// Bootstrap Icons "list" (MIT), as on showmine.com.au.
const LIST_ICON =
  'M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5';

// The first page is the home page, at /s/<site>. Below 1024 px of site width the links fold behind a
// Menu button, as on showmine.com.au (SMN-86); /website.css shows the button only there.
const Nav = ({ website, currentSlug, preview }: iNav) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav
      className={`site-nav${isOpen ? ' is-open' : ''}`}
      aria-label={'Pages'}
      onKeyDown={e => e.key === 'Escape' && setIsOpen(false)}
    >
      <a
        className={'site-name'}
        href={WebsiteService.getPageHref(website, 0, preview)}
      >
        {website.company.logoUrl ? (
          <img src={website.company.logoUrl} alt={''} />
        ) : null}
        <span>{website.company.name}</span>
      </a>
      <button
        type={'button'}
        className={'site-menu-button'}
        aria-expanded={isOpen}
        aria-controls={'site-menu'}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close' : 'Menu'}
        {isOpen ? (
          <span aria-hidden>×</span>
        ) : (
          <svg aria-hidden viewBox={'0 0 16 16'} fill={'currentColor'}>
            <path fillRule={'evenodd'} d={LIST_ICON} />
          </svg>
        )}
      </button>
      <ul id={'site-menu'}>
        {website.pages.map((page, index) => (
          <li key={page.slug}>
            <a
              href={WebsiteService.getPageHref(website, index, preview)}
              aria-current={page.slug === currentSlug ? 'page' : undefined}
              onClick={() => setIsOpen(false)}
            >
              {page.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Nav;
