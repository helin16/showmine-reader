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

export type iWebsite = {
  version: number;
  slug: string;
  companyId: string;
  isPreview?: boolean;
  // Where its pages live: /s/<slug> by default, /t/<id> for a template preview.
  basePath?: string;
  theme?: { primaryColor?: string; fontPair?: string };
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
