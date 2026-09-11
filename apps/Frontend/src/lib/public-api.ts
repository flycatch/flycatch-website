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

export type PublicCaseStudySummary = {
  heading: string;
  slug: string;
  short_heading: string;
  description: string;
  order: number;
  date: string | null;
  image_key: string | null;
  image_alt: string;
  industries: PublicNamedItem[];
  categories: PublicNamedItem[];
  technologies: PublicTechnology[];
};

export type PublicCaseStudy = PublicCaseStudySummary & {
  body: string;
  content_available_in: string[];
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

export type PublicClientLogo = {
  colour_logo_key: string | null;
  white_logo_key: string | null;
  alt_text: string;
};

export type PublicClientTestimonial = {
  client_name: string;
  title: string;
  review: string;
  client_designation: string;
  client_company: string;
  country: string;
  image_key: string | null;
  alt_text: string;
  is_clutch_review: boolean;
  order: number;
  review_link: string;
  content_available_in: string[];
};

export type PublicAuthor = {
  name: string;
  designation: string;
  writer_image_keys: string[];
};

export type PublicCategory = {
  name: string;
};

export type PublicBlogSummary = {
  title: string;
  slug: string;
  description: string;
  reading_time: number;
  created_at: string;
  image_key: string | null;
  image_alt: string;
  authors: PublicAuthor[];
  categories: PublicCategory[];
};

export type PublicBlogDetail = {
  title: string;
  slug: string;
  description: string;
  body: string;
  reading_time: number;
  image_key: string | null;
  image_alt: string;
  canonical_url: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  content_available_in: string[];
  authors: PublicAuthor[];
  categories: PublicCategory[];
};

export type PublicOverviewSummary = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
};

export type PublicOverview = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  seo: ContentSeo;
};

export type PublicAccordionItem = {
  title: string;
  contents: string;
  order: number;
};

export type PublicIndustryItem = {
  title: string;
  image_key: string | null;
  order: number;
};

export type PublicSolutionBanner = {
  image_key: string | null;
  title: string;
  sub_title: string;
  industry_type: string;
};

export type PublicSolutionIntroduction = {
  sub_title: string;
  description: string;
};

export type PublicSolutionsSection = {
  title: string;
  image_key: string | null;
  description: string;
};

export type PublicSolutionDetail = {
  title: string;
  slug: string;
  banner: PublicSolutionBanner;
  introduction: PublicSolutionIntroduction;
  solutions_section: PublicSolutionsSection;
};

export type PublicAiServiceSummary = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
};

export type PublicAiService = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_description: string;
  solutions_title: string;
  solutions_description: string;
  industry_title: string;
  industry_description: string;
  industry_items: PublicIndustryItem[];
  ai_expertise_title: string;
  ai_expertise_image_key: string | null;
  ai_expertise_accordion: PublicAccordionItem[];
  ai_expertise_accordion_description: string;
  solutions: PublicSolutionDetail[];
  faq_title: string;
  faq_description: string;
  faq_accordion: PublicAccordionItem[];
  seo: ContentSeo;
};

export type PublicListResult<T> = {
  items: T[];
  error: boolean;
  origin: string;
};

export type PublicItemResult<T> = {
  item: T | null;
  error: boolean;
  origin: string;
};

/** Visitor-facing gateway origin. Public routes live under /api/v1/public/*. */
export const DEFAULT_API_ORIGIN = 'http://localhost:8080';

export function apiOrigin(): string {
  return (process.env.PUBLIC_ORIGIN || import.meta.env.PUBLIC_ORIGIN || DEFAULT_API_ORIGIN).replace(
    /\/$/,
    '',
  );
}

/** Server-side fetch target. In Docker/k8s this is the Backend service, not localhost. */
export function fetchOrigin(): string {
  return (process.env.API_ORIGIN || import.meta.env.API_ORIGIN || apiOrigin()).replace(/\/$/, '');
}

export function publicMediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('/')) return key;
  return `/api/v1/public/media/${encodeURIComponent(key)}`;
}

export function absoluteMediaUrl(origin: string, key: string | null | undefined): string | null {
  const path = publicMediaUrl(key);
  if (!path) return null;
  return `${origin.replace(/\/$/, '')}${path}`;
}

async function getJson<T>(path: string): Promise<{ data: T | null; error: boolean; origin: string }> {
  const origin = apiOrigin();
  try {
    const response = await fetch(`${fetchOrigin()}${path}`);
    if (!response.ok) return { data: null, error: true, origin };
    return { data: (await response.json()) as T, error: false, origin };
  } catch {
    return { data: null, error: true, origin };
  }
}

type Paginated<T> = {
  items?: T[];
  page?: number;
  per_page?: number;
  total?: number;
};

async function loadPaginated<T>(path: string): Promise<PublicListResult<T>> {
  const origin = apiOrigin();
  const items: T[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  while ((page - 1) * 10 < total) {
    const separator = path.includes('?') ? '&' : '?';
    const { data, error } = await getJson<Paginated<T>>(
      `${path}${separator}page=${page}&per_page=10`,
    );
    if (error || !data) return { items, error: true, origin };
    const batch = Array.isArray(data.items) ? data.items : [];
    items.push(...batch);
    total = typeof data.total === 'number' ? data.total : batch.length;
    if (batch.length === 0) break;
    page += 1;
    if (page > 100) break;
  }
  return { items, error: false, origin };
}

export async function loadPublishedHomes(): Promise<PublicListResult<PublicHome>> {
  const { data, error, origin } = await getJson<{ items?: PublicHome[] }>('/api/v1/public/homes');
  if (error) return { items: [], error: true, origin };
  return { items: Array.isArray(data?.items) ? data.items : [], error: false, origin };
}

export async function loadPublishedClientLogos(): Promise<PublicListResult<PublicClientLogo>> {
  const { data, error, origin } = await getJson<{ items?: PublicClientLogo[] }>(
    '/api/v1/public/client-logos',
  );
  if (error) return { items: [], error: true, origin };
  return { items: Array.isArray(data?.items) ? data.items : [], error: false, origin };
}

export async function loadPublishedClientTestimonials(): Promise<
  PublicListResult<PublicClientTestimonial>
> {
  const { data, error, origin } = await getJson<{ items?: PublicClientTestimonial[] }>(
    '/api/v1/public/client-testimonials',
  );
  if (error) return { items: [], error: true, origin };
  const items = Array.isArray(data?.items) ? data.items : [];
  return { items: [...items].sort((a, b) => a.order - b.order), error: false, origin };
}

export async function loadPublishedBlogs(): Promise<PublicListResult<PublicBlogSummary>> {
  return loadPaginated<PublicBlogSummary>('/api/v1/public/blogs');
}

export async function loadPublishedBlog(slug: string): Promise<PublicItemResult<PublicBlogDetail>> {
  return getJson<PublicBlogDetail>(`/api/v1/public/blogs/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

export async function loadPublishedCaseStudies(): Promise<PublicListResult<PublicCaseStudySummary>> {
  return loadPaginated<PublicCaseStudySummary>('/api/v1/public/case-studies');
}

export async function loadPublishedCaseStudy(
  slug: string,
): Promise<PublicItemResult<PublicCaseStudy>> {
  return getJson<PublicCaseStudy>(`/api/v1/public/case-studies/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

export async function loadPublishedOverviews(): Promise<PublicListResult<PublicOverviewSummary>> {
  return loadPaginated<PublicOverviewSummary>('/api/v1/public/overview');
}

export async function loadPublishedOverview(
  slug: string,
): Promise<PublicItemResult<PublicOverview>> {
  return getJson<PublicOverview>(`/api/v1/public/overview/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

export async function loadPublishedAiServices(): Promise<PublicListResult<PublicAiServiceSummary>> {
  return loadPaginated<PublicAiServiceSummary>('/api/v1/public/ai-services');
}

export async function loadPublishedAiService(
  slug: string,
): Promise<PublicItemResult<PublicAiService>> {
  return getJson<PublicAiService>(`/api/v1/public/ai-services/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}
