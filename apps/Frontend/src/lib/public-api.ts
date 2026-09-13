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
  seo: ContentSeo;
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
  case_studies: PublicCaseStudySummary[];
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
  created_at?: string | null;
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
  seo: ContentSeo;
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

const cmsRequestCache = new Map<
  string,
  Promise<{ data: unknown; error: boolean; origin: string }>
>();
const cmsFetchedUrls: string[] = [];

/** Drop in-render CMS memoization. Tests must call this when they stub `fetch`. */
export function resetPublicApiCache(): void {
  cmsRequestCache.clear();
  cmsFetchedUrls.length = 0;
}

/** URLs that actually hit the network during the current cache window. */
export function publicApiFetchedUrls(): string[] {
  return [...cmsFetchedUrls];
}

async function getJson<T>(path: string): Promise<{ data: T | null; error: boolean; origin: string }> {
  const origin = apiOrigin();
  const url = `${fetchOrigin()}${path}`;
  const cached = cmsRequestCache.get(url);
  if (cached) {
    return cached as Promise<{ data: T | null; error: boolean; origin: string }>;
  }
  const pending = (async () => {
    cmsFetchedUrls.push(url);
    try {
      const response = await fetch(url);
      if (!response.ok) return { data: null, error: true, origin };
      return { data: (await response.json()) as T, error: false, origin };
    } catch {
      return { data: null, error: true, origin };
    }
  })();
  cmsRequestCache.set(url, pending);
  return pending as Promise<{ data: T | null; error: boolean; origin: string }>;
}

type Paginated<T> = {
  items?: T[];
  page?: number;
  per_page?: number;
  total?: number;
};

export type PublicListOptions = {
  /** Stop after this many items and request only as many pages as needed. */
  maxItems?: number;
};

const PUBLIC_LIST_PAGE_SIZE = 10;

async function loadPaginated<T>(
  path: string,
  options: PublicListOptions = {},
): Promise<PublicListResult<T>> {
  const origin = apiOrigin();
  const items: T[] = [];
  const maxItems = options.maxItems;
  const perPage =
    maxItems !== undefined
      ? Math.min(PUBLIC_LIST_PAGE_SIZE, Math.max(1, maxItems))
      : PUBLIC_LIST_PAGE_SIZE;
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  while ((page - 1) * perPage < total) {
    if (maxItems !== undefined && items.length >= maxItems) break;
    const separator = path.includes('?') ? '&' : '?';
    const { data, error } = await getJson<Paginated<T>>(
      `${path}${separator}page=${page}&per_page=${perPage}`,
    );
    if (error || !data) return { items, error: true, origin };
    const batch = Array.isArray(data.items) ? data.items : [];
    items.push(...batch);
    total = typeof data.total === 'number' ? data.total : batch.length;
    if (batch.length === 0) break;
    page += 1;
    if (page > 100) break;
  }
  return {
    items: maxItems !== undefined ? items.slice(0, maxItems) : items,
    error: false,
    origin,
  };
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

export async function loadPublishedBlogs(
  options: PublicListOptions = {},
): Promise<PublicListResult<PublicBlogSummary>> {
  return loadPaginated<PublicBlogSummary>('/api/v1/public/blogs', options);
}

/** Imports that ran before the blog slug column was widened stored 128 characters. */
export const LEGACY_BLOG_SLUG_LIMIT = 128;

export function publishedBlogSlugCandidates(slug: string): string[] {
  const normalized = slug.trim();
  if (normalized.length <= LEGACY_BLOG_SLUG_LIMIT) {
    return [normalized];
  }
  return [normalized, normalized.slice(0, LEGACY_BLOG_SLUG_LIMIT)];
}

export async function loadPublishedBlog(slug: string): Promise<PublicItemResult<PublicBlogDetail>> {
  let last: PublicItemResult<PublicBlogDetail> = { item: null, error: true, origin: apiOrigin() };
  for (const candidate of publishedBlogSlugCandidates(slug)) {
    const result = await getJson<PublicBlogDetail>(
      `/api/v1/public/blogs/${encodeURIComponent(candidate)}`,
    );
    last = { item: result.data, error: result.error, origin: result.origin };
    if (result.data) {
      return last;
    }
  }
  return last;
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

export type PublicLanding = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  introduction_third_paragraph?: string;
  accordion?: PublicAccordionItem[];
  offering_image_key?: string | null;
  offering_title?: string;
  offering_description?: string;
  experience_title?: string;
  experience_accordion?: PublicAccordionItem[];
  experience_image_key?: string | null;
  experience_description?: string;
  outcomes_image_key?: string | null;
  outcomes_title?: string;
  outcomes_description?: string;
  banner_tag_line?: string;
  faq_title?: string;
  faq_description?: string;
  faq_accordion?: PublicAccordionItem[];
  seo: ContentSeo;
};

export type PublicNamedPage = Omit<PublicLanding, 'slug'> & {
  page_name: string;
};

export type PublicSolutionIndex = {
  banner_image_key: string | null;
  banner_title: string;
  section_title: string;
  seo: ContentSeo;
};

export type PublicSolutionProductSummary = {
  slug: string;
  product_title: string;
  product_description: string;
  product_tag: string;
  product_logo_key: string | null;
  product_card_image_key: string | null;
  card_image_on_right: boolean;
  order: number;
};

export type PublicSolutionProduct = PublicSolutionProductSummary & {
  product_banner_image_key: string | null;
  banner_image_on_right: boolean;
  seo: ContentSeo;
};

export type PublicSolutionDetailPage = {
  title: string;
  slug: string;
  banner: PublicSolutionBanner;
  introduction: PublicSolutionIntroduction & {
    items?: { title: string; order: number; color: string }[];
    icon_keys?: string[];
    sub_description?: string;
    image_key?: string | null;
  };
  challenges?: {
    name: string;
    description: string;
    image_key: string | null;
    items: { title: string; order: number; color: string }[];
  };
  benefits?: {
    description: string;
    items: { title: string; order: number; color: string }[];
  };
  solutions_section: PublicSolutionsSection;
  cta?: { title: string; description: string; button_name: string };
  seo: ContentSeo;
};

export type PublicOpeningSummary = {
  job_id: string;
  role: string;
  slug: string;
  experience: string;
  location: string;
  job_type: string;
  job_status: string;
  specialization: string;
  body: string;
  exp_date: string | null;
};

export type PublicEmployeeTestimonial = {
  name: string;
  designation: string;
  review: string;
  image_key: string | null;
  order: number;
};

export type PublicNewsSummary = {
  title: string;
  slug: string;
  description: string;
  image_key: string | null;
  reading_time: number;
  button_name: string;
};

export type PublicNews = PublicNewsSummary & {
  body: string;
  seo: ContentSeo;
};

export type PublicResource = {
  title: string;
  slug: string;
  image_key: string | null;
  reading_time: number;
  button_name: string;
  pdf_key: string | null;
  seo: ContentSeo;
};

export type PublicMembership = {
  id: string;
  title: string;
  description: string;
  images: { image_key: string | null; alt: string }[];
  seo: ContentSeo;
};

export type PublicLegalPage = {
  title: string;
  slug: string;
  body: string;
  seo: ContentSeo;
};

export type PublicSaudiPage = {
  id: string;
  banner_title: string;
  service_section: {
    image_key: string | null;
    types_title: string;
    contents: string;
    links: string;
  }[];
  banner_explore_text: string;
  services_title: string;
  banner_image_key: string | null;
  video_key: string | null;
  seo: ContentSeo;
};

async function loadFirstOrSlug<T extends { slug?: string }>(
  prefix: string,
  preferredSlug?: string,
): Promise<PublicItemResult<T>> {
  if (preferredSlug) {
    const exact = await getJson<T>(`${prefix}/${encodeURIComponent(preferredSlug)}`);
    if (exact.data) return { item: exact.data, error: false, origin: exact.origin };
  }
  const listed = await getJson<Paginated<T> | T[]>(prefix);
  const items = Array.isArray(listed.data)
    ? listed.data
    : Array.isArray(listed.data?.items)
      ? listed.data.items
      : [];
  const match =
    (preferredSlug ? items.find((item) => item.slug === preferredSlug) : undefined) ?? items[0];
  if (!match?.slug) return { item: null, error: listed.error, origin: listed.origin };
  if (match && 'banner_title' in match && 'introduction_first_paragraph' in match) {
    return { item: match as T, error: false, origin: listed.origin };
  }
  return getJson<T>(`${prefix}/${encodeURIComponent(match.slug)}`).then(({ data, error, origin }) => ({
    item: data,
    error,
    origin,
  }));
}

export async function loadPublishedLanding(
  prefix: string,
  preferredSlug?: string,
): Promise<PublicItemResult<PublicLanding>> {
  return loadFirstOrSlug<PublicLanding>(prefix, preferredSlug);
}

export async function loadPublishedNamedPage(
  prefix: string,
  pageName: string,
): Promise<PublicItemResult<PublicNamedPage>> {
  const exact = await getJson<PublicNamedPage>(`${prefix}/${encodeURIComponent(pageName)}`);
  if (exact.data) return { item: exact.data, error: false, origin: exact.origin };
  const listed = await getJson<Paginated<PublicNamedPage>>(prefix);
  const items = Array.isArray(listed.data?.items) ? listed.data.items : [];
  const match = items.find((item) => item.page_name === pageName) ?? items[0];
  if (!match) return { item: null, error: listed.error, origin: listed.origin };
  if ('introduction_first_paragraph' in match) {
    return { item: match, error: false, origin: listed.origin };
  }
  return getJson<PublicNamedPage>(`${prefix}/${encodeURIComponent(match.page_name)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

export async function loadPublishedSolutionsIndex(): Promise<PublicListResult<PublicSolutionIndex>> {
  const { data, error, origin } = await getJson<{ items?: PublicSolutionIndex[] }>(
    '/api/v1/public/solutions',
  );
  return { items: Array.isArray(data?.items) ? data.items : [], error, origin };
}

export async function loadPublishedSolutionProducts(): Promise<
  PublicListResult<PublicSolutionProductSummary>
> {
  return loadPaginated<PublicSolutionProductSummary>('/api/v1/public/solution-products');
}

export async function loadPublishedSolutionProduct(
  slug: string,
): Promise<PublicItemResult<PublicSolutionProduct>> {
  return getJson<PublicSolutionProduct>(
    `/api/v1/public/solution-products/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedSolutionDetails(): Promise<
  PublicListResult<PublicSolutionDetail>
> {
  return loadPaginated<PublicSolutionDetail>('/api/v1/public/solution-details');
}

export async function loadPublishedSolutionDetailPage(
  slug: string,
): Promise<PublicItemResult<PublicSolutionDetailPage>> {
  return getJson<PublicSolutionDetailPage>(
    `/api/v1/public/solution-details/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedOpenings(): Promise<PublicListResult<PublicOpeningSummary>> {
  return loadPaginated<PublicOpeningSummary>('/api/v1/public/openings');
}

export async function loadPublishedOpening(
  slug: string,
): Promise<PublicItemResult<PublicOpeningSummary>> {
  return getJson<PublicOpeningSummary>(`/api/v1/public/openings/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

export async function loadPublishedEmployeeTestimonials(): Promise<
  PublicListResult<PublicEmployeeTestimonial>
> {
  const { data, error, origin } = await getJson<{ items?: PublicEmployeeTestimonial[] }>(
    '/api/v1/public/employee-testimonials',
  );
  const items = Array.isArray(data?.items) ? data.items : [];
  return { items: [...items].sort((a, b) => a.order - b.order), error, origin };
}

export async function loadPublishedNews(): Promise<PublicListResult<PublicNewsSummary>> {
  return loadPaginated<PublicNewsSummary>('/api/v1/public/news');
}

export async function loadPublishedNewsItem(slug: string): Promise<PublicItemResult<PublicNews>> {
  return getJson<PublicNews>(`/api/v1/public/news/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

export type PublicDownload = {
  id: string;
  name: string;
  company: string;
};

export async function loadPublishedDownloads(): Promise<PublicListResult<PublicDownload>> {
  return loadPaginated<PublicDownload>('/api/v1/public/downloads');
}

export async function loadPublishedResources(): Promise<PublicListResult<PublicResource>> {
  return loadPaginated<PublicResource>('/api/v1/public/resources');
}

export async function loadPublishedResource(slug: string): Promise<PublicItemResult<PublicResource>> {
  return getJson<PublicResource>(`/api/v1/public/resources/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

export async function loadPublishedMemberships(): Promise<PublicListResult<PublicMembership>> {
  return loadPaginated<PublicMembership>('/api/v1/public/memberships');
}

export async function loadPublishedLegalPage(
  kind: 'privacy-policies' | 'terms',
  slug: string,
): Promise<PublicItemResult<PublicLegalPage>> {
  const exact = await getJson<PublicLegalPage>(
    `/api/v1/public/${kind}/${encodeURIComponent(slug)}`,
  );
  if (exact.data) return { item: exact.data, error: false, origin: exact.origin };
  const listed = await loadPaginated<PublicLegalPage>(`/api/v1/public/${kind}`);
  const match = listed.items.find((item) => item.slug === slug) ?? listed.items[0] ?? null;
  return { item: match, error: listed.error, origin: listed.origin };
}

export async function loadPublishedSaudiPages(): Promise<PublicListResult<PublicSaudiPage>> {
  return loadPaginated<PublicSaudiPage>('/api/v1/public/flycatch-saudi-arabia');
}
