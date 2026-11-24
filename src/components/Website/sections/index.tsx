import iItem from '@/types/iItem';
import { iWebsite, iWebsiteSection } from '@/types/iWebsite';
import WebsiteService from '@/serivices/WebsiteService';
import ItemService from '@/serivices/ItemService';

type iSection = {
  section: iWebsiteSection;
  website: iWebsite;
  preview?: string;
  articles?: iItem[];
};

export const Hero = ({ section, website, preview }: iSection) => {
  const href = WebsiteService.getHref(website.slug, section.buttonUrl, preview);
  return (
    <section
      className={`site-hero${section.imageUrl ? ' with-image' : ''}`}
      style={
        section.imageUrl
          ? { backgroundImage: `url("${encodeURI(section.imageUrl)}")` }
          : undefined
      }
    >
      {section.heading ? <h1>{section.heading}</h1> : null}
      {section.subheading ? <p>{section.subheading}</p> : null}
      {href && section.buttonText ? (
        <a className={'site-button'} href={href}>
          {section.buttonText}
        </a>
      ) : null}
    </section>
  );
};

// The API cleans this HTML when it is saved and again when published; the Reader's CSP also blocks inline script.
export const Text = ({ section }: iSection) => (
  <section
    className={'site-text'}
    dangerouslySetInnerHTML={{ __html: `${section.html || ''}` }}
  />
);

export const Image = ({ section }: iSection) =>
  section.url ? (
    <figure className={'site-image'}>
      <img src={section.url} alt={section.alt || ''} />
      {section.caption ? <figcaption>{section.caption}</figcaption> : null}
    </figure>
  ) : null;

export const Gallery = ({ section }: iSection) => (
  <section className={'site-gallery'}>
    {(section.images || [])
      .filter((image: { url?: string }) => image.url)
      .map(
        (
          image: { assetId: string; url: string; alt?: string },
          index: number
        ) => (
          <img
            key={`${image.assetId}-${index}`}
            src={image.url}
            alt={image.alt || ''}
          />
        )
      )}
  </section>
);

export const Contact = ({ section, website }: iSection) => {
  const { phone, email, address } = website.company;
  return (
    <section className={'site-contact'}>
      <h2>Contact 联系我们</h2>
      <ul>
        {section.showPhone && phone ? (
          <li>
            <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`}>{phone}</a>
          </li>
        ) : null}
        {section.showEmail && email ? (
          <li>
            <a href={`mailto:${email}`}>{email}</a>
          </li>
        ) : null}
        {section.showAddress && address ? <li>{address}</li> : null}
      </ul>
      {/^https:\/\//.test(`${section.mapUrl || ''}`) ? (
        <iframe
          className={'site-map'}
          src={section.mapUrl}
          title={'Map'}
          loading={'lazy'}
        />
      ) : null}
    </section>
  );
};

export const Articles = ({ articles }: iSection) =>
  articles && articles.length > 0 ? (
    <section className={'site-articles'}>
      <ul>
        {articles.map(item => (
          <li key={item.id}>
            <a href={`/item/${item.id}`}>
              <img src={ItemService.getCoverImageUrl(item)} alt={''} />
              <span>{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

export const SECTIONS: { [type: string]: (props: iSection) => any } = {
  hero: Hero,
  text: Text,
  image: Image,
  gallery: Gallery,
  contact: Contact,
  articles: Articles
};
