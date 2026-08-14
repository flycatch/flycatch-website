import snapshotData from '../data/published.json';

export interface SeoMetadata {
  title: string;
  description: string;
  canonical_path: string;
  indexable: boolean;
  social_title?: string;
  social_description?: string;
  social_image_key?: string | null;
  primary_heading: string;
  summary: string;
  structured_data_templates?: string[];
}

export interface PageContent {
  slug: string;
  seo: SeoMetadata;
  body: string;
  message_keys?: Record<string, string>;
}

export interface SiteSettings {
  site_name: string;
  default_locale: string;
  locale_url_strategy: string;
  robots_policy: string;
  default_social_image_key?: string | null;
  canonical_origin: string;
}

export interface PublishedSnapshot {
  revision: string;
  written_at: string;
  site_settings: SiteSettings;
  pages: PageContent[];
}

export function loadPublishedSnapshot(): PublishedSnapshot {
  return snapshotData as PublishedSnapshot;
}

export function getPageBySlug(slug: string): PageContent | undefined {
  return loadPublishedSnapshot().pages.find((page) => page.slug === slug);
}

export function getSiteSettings(): SiteSettings {
  return loadPublishedSnapshot().site_settings;
}
