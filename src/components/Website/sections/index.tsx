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

// A band's buttons (specs/005-website-blocks, slice 88a): the first in the main colour, a second in the second colour,
// and a small note under them. A button shows only with both its text and its link.
export const Buttons = ({ section, website, preview }: iSection) => {
  const first = WebsiteService.getHref(website, section.buttonUrl, preview);
  const second = WebsiteService.getHref(website, section.button2Url, preview);
  const hasFirst = !!(first && section.buttonText);
  const hasSecond = !!(second && section.button2Text);
  if (!hasFirst && !hasSecond && !section.note) return null;
  return (
    <div className={'site-buttons'}>
      {hasFirst ? (
        <a className={'site-button'} href={first}>
          {section.buttonText}
        </a>
      ) : null}
      {hasSecond ? (
        <a className={'site-button second'} href={second}>
          {section.button2Text}
        </a>
      ) : null}
      {section.note ? <p className={'site-note'}>{section.note}</p> : null}
    </div>
  );
};

export const Hero = ({ section, website, preview }: iSection) => (
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
    <Buttons section={section} website={website} preview={preview} />
  </section>
);

// Image beside text (spec 005, slice 88a): the image on the left or right from 768px of page width, above the text
// when narrower. The text is plain; its line breaks show.
export const Split = ({ section, website, preview }: iSection) => (
  <section
    className={`site-split image-${section.imageSide === 'right' ? 'right' : 'left'}`}
  >
    {section.imageUrl ? (
      <img src={section.imageUrl} alt={section.imageAlt || ''} />
    ) : null}
    <div className={'site-split-text'}>
      {section.heading ? <h2>{section.heading}</h2> : null}
      {section.text ? <p>{section.text}</p> : null}
      <Buttons section={section} website={website} preview={preview} />
    </div>
  </section>
);

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
        // Any https page can be set here, so it is sandboxed: it cannot navigate this page or submit forms.
        <iframe
          className={'site-map'}
          src={section.mapUrl}
          title={'Map'}
          loading={'lazy'}
          sandbox={'allow-scripts allow-same-origin allow-popups'}
          referrerPolicy={'no-referrer'}
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
  split: Split,
  text: Text,
  image: Image,
  gallery: Gallery,
  contact: Contact,
  articles: Articles
};
