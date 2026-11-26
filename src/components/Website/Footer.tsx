import { iWebsite, iWebsiteFooterItem } from '@/types/iWebsite';
import WebsiteService from '@/serivices/WebsiteService';

// Line icons for contact lines (24 px grid, drawn with the text colour), drawn for ShowMine.
// ponytail: the admin canvas has a copy (Canvas/canvasBlocks.tsx); tests in both pin the names.
export const FOOTER_ICONS: { [icon: string]: string[] } = {
  address: [
    'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z',
    'M14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z'
  ],
  phone: [
    'M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z',
    'M11 18h2'
  ],
  email: [
    'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
    'm3 7 9 6 9-6'
  ],
  wechat: [
    'M9 4C5.1 4 2 6.5 2 9.6c0 1.8 1 3.3 2.6 4.3L4 16l2.6-1.3c.8.2 1.6.3 2.4.3',
    'M15.5 9c3.6 0 6.5 2.3 6.5 5.2 0 1.5-.8 2.9-2.1 3.8l.6 2-2.3-1.1c-.9.3-1.8.4-2.7.4-3.6 0-6.5-2.3-6.5-5.1S11.9 9 15.5 9Z'
  ],
  message: ['M4 5h16v11H9l-5 4V5Z']
};

type iFooter = { website: iWebsite; preview?: string };

const Item = ({
  item,
  website,
  preview
}: iFooter & { item: iWebsiteFooterItem }) => {
  switch (item.type) {
    case 'text':
      return <p className={'site-footer-text'}>{item.text}</p>;
    case 'contact':
      return (
        <p className={'site-footer-contact'}>
          {FOOTER_ICONS[item.icon] ? (
            <svg aria-hidden viewBox={'0 0 24 24'}>
              {FOOTER_ICONS[item.icon].map(d => (
                <path key={d} d={d} />
              ))}
            </svg>
          ) : null}
          <span>{item.text}</span>
        </p>
      );
    case 'button': {
      const href = WebsiteService.getHref(website, item.url, preview);
      return href ? (
        <p>
          <a className={'site-button'} href={href}>
            {item.label}
          </a>
        </p>
      ) : null;
    }
    case 'image': {
      if (!item.url) {
        return null;
      }
      const image = <img src={item.url} alt={item.alt || ''} />;
      const href = WebsiteService.getHref(website, item.link, preview);
      return (
        <p className={'site-footer-image'}>
          {href ? <a href={href}>{image}</a> : image}
        </p>
      );
    }
    default:
      return null;
  }
};

// The layout's footer: columns side by side, stacking on narrow sites, then the copyright line. None without one.
const Footer = ({ website, preview }: iFooter) => {
  const footer = website.layout?.footer;
  if (!footer) {
    return null;
  }
  return (
    <footer className={'site-footer'}>
      <div className={'site-footer-columns'}>
        {(footer.columns || []).map((column, index) => (
          <div key={index} className={'site-footer-column'}>
            {column.heading ? <h2>{column.heading}</h2> : null}
            {(column.items || []).map((item, itemIndex) => (
              <Item
                key={itemIndex}
                item={item}
                website={website}
                preview={preview}
              />
            ))}
          </div>
        ))}
      </div>
      {footer.copyright ? (
        <p className={'site-copyright'}>{footer.copyright}</p>
      ) : null}
    </footer>
  );
};

export default Footer;
