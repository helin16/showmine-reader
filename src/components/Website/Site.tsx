import iItem from '@/types/iItem';
import { iWebsite, iWebsitePage } from '@/types/iWebsite';
import Nav from '@/components/Website/Nav';
import { SECTIONS } from '@/components/Website/sections';

type iSite = {
  website: iWebsite;
  page: iWebsitePage;
  preview?: string;
  // Each articles section's items, by section id.
  articles: { [sectionId: string]: iItem[] };
};

const FONT_PAIRS = ['modern', 'classic', 'friendly'];
const COLOR = /^#[0-9a-fA-F]{6}$/;

const Site = ({ website, page, preview, articles }: iSite) => {
  const { primaryColor, fontPair } = website.theme || {};
  return (
    <div
      className={`site site-font-${FONT_PAIRS.includes(`${fontPair}`) ? fontPair : 'modern'}`}
      style={
        COLOR.test(`${primaryColor}`)
          ? ({ '--site-primary': primaryColor } as any)
          : undefined
      }
    >
      {preview ? <p className={'site-preview-note'}>Preview 预览</p> : null}
      <Nav website={website} currentSlug={page.slug} preview={preview} />
      <main className={'site-page'}>
        {page.sections.map(section => {
          const Section = SECTIONS[section.type];
          return Section ? (
            <Section
              key={section.id}
              section={section}
              website={website}
              preview={preview}
              articles={articles[section.id]}
            />
          ) : null;
        })}
      </main>
    </div>
  );
};

export default Site;
