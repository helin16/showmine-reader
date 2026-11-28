// The website copy from GET /publicWebsite/:slug (showmine-admin specs/001-website-builder, data-model "Published copy").
export type iWebsiteSeo = {
  title?: string;
  description?: string;
  imageAssetId?: string | null;
  imageUrl?: string;
};

export type iWebsiteSection = {
  id: string;
  type: string;
  [field: string]: any;
};

export type iWebsitePage = {
  slug: string;
  title: string;
  seo?: iWebsiteSeo;
  sections: iWebsiteSection[];
};

// The site layout (showmine-admin specs/004-website-visual-editor, slice 4a). Plain text only.
export type iWebsiteFooterItem =
  | { type: 'text'; text: string }
  | { type: 'contact'; icon: string; text: string }
  | { type: 'button'; label: string; url: string }
  // url: the image's address; link: where it leads.
  | {
      type: 'image';
      assetId: string;
      alt?: string;
      link?: string;
      url?: string;
    };

export type iWebsiteLayout = {
  header?: {
    showLogo?: boolean;
    showName?: boolean;
    hiddenSlugs?: string[];
    links?: { label: string; url: string }[];
  };
  footer?: {
    columns?: { heading?: string; items?: iWebsiteFooterItem[] }[];
    copyright?: string;
  } | null;
  // Shared blocks above and below every page's own (slice 4b): page sections.
  sharedAbove?: iWebsiteSection[];
  sharedBelow?: iWebsiteSection[];
};

export type iWebsite = {
  version: number;
  slug: string;
  companyId: string;
  isPreview?: boolean;
  // Where its pages live: /s/<slug> by default, /t/<id> for a template preview.
  basePath?: string;
  theme?: {
    primaryColor?: string;
    fontPair?: string;
    backgroundColor?: string;
    headingColor?: string;
    secondaryColor?: string;
    buttonColor?: string;
    contentWidth?: number;
    // plain (absent) or airy (SMN-93).
    style?: string;
  };
  // Absent or null: the site shows as before the layout.
  layout?: iWebsiteLayout | null;
  seo?: iWebsiteSeo;
  company: {
    name: string;
    logoUrl?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  pages: iWebsitePage[];
};
