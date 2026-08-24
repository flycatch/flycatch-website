export type ContentSeo = {
  title: string;
  description: string;
  canonical_url: string;
  meta_title: string;
  h1_tag: string;
  image_alt: string;
  image_key: string | null;
};

export type PublicNamedItem = {
  name: string;
};

export type PublicTechnology = {
  name: string;
  logo_key: string | null;
};

export type PublicCaseStudy = {
  heading: string;
  slug: string;
  short_heading: string;
  description: string;
  body: string;
  order: number;
  date: string | null;
  image_key: string | null;
  image_alt: string;
  content_available_in: string[];
  industries: PublicNamedItem[];
  categories: PublicNamedItem[];
  technologies: PublicTechnology[];
};

export type HomeService = {
  services_types_title: string;
  services_image_key: string | null;
  services_contents: string;
  our_services_links: string;
};

export type HomeFaq = {
  title: string;
  contents: string;
};

export type PublicHome = {
  title: string;
  video_key: string | null;
  banner_title: string;
  seo: ContentSeo;
  case_studies: PublicCaseStudy[];
  services: HomeService[];
  banner_explore_text: string;
  faq_title: string;
  faq_description: string;
  faqs: HomeFaq[];
  content_available_in: string[];
};

export function publicMediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  return `/api/v1/public/media/${encodeURIComponent(key)}`;
}

export async function loadPublishedHomes(): Promise<PublicHome[]> {
  const origin = (import.meta.env.PUBLIC_ORIGIN || process.env.PUBLIC_ORIGIN || '').replace(
    /\/$/,
    '',
  );
  if (!origin) return [];
  try {
    const response = await fetch(`${origin}/api/v1/public/homes`);
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: PublicHome[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}
