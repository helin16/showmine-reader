import iItem from '@/types/iItem';
import { iWebsite, iWebsitePage } from '@/types/iWebsite';
import Nav from '@/components/Website/Nav';
import { SECTIONS } from '@/components/Website/sections';
import Footer from '@/components/Website/Footer';

type iSite = {
  website: iWebsite;
  page: iWebsitePage;
  preview?: string;
  // Each articles section's items, by section id.
  articles: { [sectionId: string]: iItem[] };
};

const FONT_PAIRS = ['modern', 'classic', 'friendly'];
const COLOR = /^#[0-9a-fA-F]{6}$/;
// Theme colours as the variables /website.css reads (slice 4a adds all but the main colour).
const COLOR_VARS = {
  primaryColor: '--site-primary',
  backgroundColor: '--site-bg',
  headingColor: '--site-heading',
  secondaryColor: '--site-secondary'
} as const;
const CONTENT_WIDTHS = [960, 1140, 1280];

// Only values the API allows reach the page's style.
export const getThemeStyle = (theme: iWebsite['theme'] = {}) => {
  const style: { [name: string]: string } = {};
  (Object.keys(COLOR_VARS) as (keyof typeof COLOR_VARS)[]).forEach(key => {
    if (COLOR.test(`${theme[key]}`)) {
      style[COLOR_VARS[key]] = `${theme[key]}`;
    }
  });
  if (CONTENT_WIDTHS.includes(Number(theme.contentWidth))) {
    style['--site-width'] = `${theme.contentWidth}px`;
  }
  return Object.keys(style).length > 0 ? (style as any) : undefined;
};

const Site = ({ website, page, preview, articles }: iSite) => {
  const { fontPair } = website.theme || {};
  return (
    <div
      className={`site site-font-${FONT_PAIRS.includes(`${fontPair}`) ? fontPair : 'modern'}`}
      style={getThemeStyle(website.theme)}
    >
      {preview || website.isPreview ? (
        <p className={'site-preview-note'}>Preview 预览</p>
      ) : null}
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
      <Footer website={website} preview={preview} />
    </div>
  );
};

export default Site;
