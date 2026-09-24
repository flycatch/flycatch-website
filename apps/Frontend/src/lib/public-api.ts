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

export type PublicOpening = {
  job_id: string;
  exp_date: string | null;
  role: string;
  slug: string;
  experience: string;
  location: string;
  job_type: string;
  job_status: string;
  specialization: string;
  body: string;
};

export type PublicEmployeeTestimonial = {
  id: string;
  name: string;
  designation: string;
  review: string;
  image_key: string | null;
  order: number;
  listed: boolean;
  publish_date: string | null;
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

export type PublicNewsCategory = {
  id?: string;
  name: string;
};

export type PublicNewsAuthor = {
  name: string;
  bio: string;
  designation: string;
  writer_image_keys: string[];
};

export type PublicNews = {
  title: string;
  slug: string;
  body: string;
  news_categories: PublicNewsCategory[];
  authors: PublicNewsAuthor[];
  image_key: string | null;
  description: string;
  button_name: string;
  reading_time: number;
  facebook: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  youtube_url: string;
  created_at: string;
  seo: ContentSeo;
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

export type PublicMobileApplicationDevelopmentSummary = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
};

export type PublicMobileApplicationDevelopment = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  introduction_third_paragraph: string;
  accordion: PublicAccordionItem[];
  offering_image_key: string | null;
  offering_title: string;
  offering_description: string;
  faq_title: string;
  faq_description: string;
  faq_accordion: PublicAccordionItem[];
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

export type PublicHeadingItem = {
  title: string;
  order: number;
  color: string;
};

export type PublicSolutionTypeItem = {
  image_key: string | null;
  description: string;
  order: number;
  title: string;
};

export type PublicSolutionDetailsIntroduction = {
  items: PublicHeadingItem[];
  description: string;
  icon_keys: string[];
  sub_title: string;
  sub_description: string;
  image_key: string | null;
};

export type PublicSolutionDetailsChallenges = {
  items: PublicHeadingItem[];
  description: string;
  image_key: string | null;
  name: string;
  position: string;
  types: PublicSolutionTypeItem[];
};

export type PublicSolutionDetailsBenefits = {
  items: PublicHeadingItem[];
  description: string;
  types: PublicSolutionTypeItem[];
};

export type PublicSolutionDetailsCta = {
  title: string;
  description: string;
  button_name: string;
};

/** Full public Solution Details page (not the nested AI Services card type). */
export type PublicSolutionDetailsPage = {
  title: string;
  slug: string;
  banner: PublicSolutionBanner;
  introduction: PublicSolutionDetailsIntroduction;
  challenges: PublicSolutionDetailsChallenges;
  benefits: PublicSolutionDetailsBenefits;
  solutions_section: PublicSolutionsSection;
  cta: PublicSolutionDetailsCta;
  seo: ContentSeo;
};

export function sortByOrder<T extends { order: number }>(items: T[] | null | undefined): T[] {
  return [...(items ?? [])].sort((a, b) => a.order - b.order);
}

export function headingColor(color: string | null | undefined): string | undefined {
  const value = color?.trim();
  return value || undefined;
}

/** HTML, Slate-like JSON strings, or plain text from CMS fields. */
export function cmsRichContent(value: string | null | undefined): { html: string; text: string } {
  const raw = (value ?? '').trim();
  if (!raw) return { html: '', text: '' };
  if (raw.startsWith('<')) {
    return {
      html: raw,
      text: raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  }
  if (raw.startsWith('[') || raw.startsWith('{')) {
    const matches = [...raw.matchAll(/['"]text['"]\s*:\s*['"]((?:\\.|[^'\\])*)['"]/g)];
    if (matches.length) {
      return { html: '', text: matches.map((match) => match[1]).join(' ').trim() };
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      const collected: string[] = [];
      const walk = (node: unknown) => {
        if (!node) return;
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        if (typeof node === 'object') {
          const record = node as { text?: unknown; children?: unknown };
          if (typeof record.text === 'string') collected.push(record.text);
          walk(record.children);
        }
      };
      walk(parsed);
      if (collected.length) return { html: '', text: collected.join(' ').trim() };
    } catch {
      /* keep raw text */
    }
  }
  return { html: '', text: raw };
}

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

export type PublicApplicationDevelopmentSummary = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
};

export type PublicOfferingsLanding = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  accordion: PublicAccordionItem[];
  offering_image_key: string | null;
  offering_title: string;
  offering_description: string;
  faq_title: string;
  faq_description: string;
  faq_accordion: PublicAccordionItem[];
  seo: ContentSeo;
};

export type PublicApplicationDevelopment = PublicOfferingsLanding & {
  content_available_in: string[];
};

export type PublicApplicationModernizationSummary = PublicApplicationDevelopmentSummary;

export type PublicApplicationModernization = PublicOfferingsLanding;

export type PublicUserCenteredDesignSummary = PublicApplicationDevelopmentSummary;

export type PublicUserCenteredDesign = PublicOfferingsLanding;

export type PublicNamedServiceSummary = {
  page_name: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
};

export type PublicNamedService = {
  page_name: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  accordion: PublicAccordionItem[];
  offering_image_key: string | null;
  offering_title: string;
  offering_description: string;
  faq_title: string;
  faq_description: string;
  faq_accordion: PublicAccordionItem[];
  seo: ContentSeo;
};

export type PublicCloudServiceSummary = PublicNamedServiceSummary;
export type PublicCloudService = PublicNamedService;
export type PublicDataAnalyticSummary = PublicNamedServiceSummary;
export type PublicDataAnalytic = PublicNamedService;

export type PublicDigitalTransformationSummary = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  banner_tag_line: string;
};

export type PublicDigitalTransformation = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  banner_tag_line: string;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  accordion: PublicAccordionItem[];
  outcomes_image_key: string | null;
  outcomes_title: string;
  outcomes_description: string;
  faq_title: string;
  faq_description: string;
  faq_accordion: PublicAccordionItem[];
  seo: ContentSeo;
};

export function namedServiceAsOfferingsLanding(page: PublicNamedService): PublicOfferingsLanding {
  return {
    slug: page.page_name,
    banner_title: page.banner_title,
    banner_image_key: page.banner_image_key,
    introduction_title: page.introduction_title,
    introduction_first_paragraph: page.introduction_first_paragraph,
    introduction_second_paragraph: page.introduction_second_paragraph,
    accordion: page.accordion,
    offering_image_key: page.offering_image_key,
    offering_title: page.offering_title,
    offering_description: page.offering_description,
    faq_title: page.faq_title,
    faq_description: page.faq_description,
    faq_accordion: page.faq_accordion,
    seo: page.seo,
  };
}

export function digitalTransformationAsOfferingsLanding(
  page: PublicDigitalTransformation,
): PublicOfferingsLanding {
  return {
    slug: page.slug,
    banner_title: page.banner_title,
    banner_image_key: page.banner_image_key,
    introduction_title: page.introduction_title,
    introduction_first_paragraph: page.introduction_first_paragraph,
    introduction_second_paragraph: page.introduction_second_paragraph,
    accordion: page.accordion,
    offering_image_key: page.outcomes_image_key,
    offering_title: page.outcomes_title,
    offering_description: page.outcomes_description,
    faq_title: page.faq_title,
    faq_description: page.faq_description,
    faq_accordion: page.faq_accordion,
    seo: page.seo,
  };
}

export type PublicDevOpsConsultSummary = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
};

export type PublicDevOpsConsult = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  experience_title: string;
  experience_accordion: PublicAccordionItem[];
  experience_image_key: string | null;
  experience_description: string;
  faq_title: string;
  faq_description: string;
  faq_accordion: PublicAccordionItem[];
  seo: ContentSeo;
};

export type PublicInfrastructureManagementSummary = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
};

export type PublicInfrastructureManagement = {
  slug: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  faq_title: string;
  faq_description: string;
  faq_accordion: PublicAccordionItem[];
  seo: ContentSeo;
};

export type PublicSolution = {
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

export type PublicSolutionProduct = {
  product_title: string;
  product_description: string;
  product_tag: string;
  product_logo_key: string | null;
  product_card_image_key: string | null;
  product_banner_image_key: string | null;
  card_image_on_right: boolean;
  banner_image_on_right: boolean;
  slug: string;
  order: number;
};

export type PublicListResult<T> = {
  items: T[];
  error: boolean;
  origin: string;
};

export type PublicPageResult<T> = PublicListResult<T> & {
  page: number;
  per_page: number;
  total: number;
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

export async function loadPublishedOpenings(): Promise<PublicListResult<PublicOpening>> {
  return loadPaginated<PublicOpening>('/api/v1/public/openings');
}

export async function loadPublishedOpening(slug: string): Promise<PublicItemResult<PublicOpening>> {
  return getJson<PublicOpening>(`/api/v1/public/openings/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

export async function loadPublishedEmployeeTestimonials(): Promise<
  PublicListResult<PublicEmployeeTestimonial>
> {
  const result = await loadPaginated<PublicEmployeeTestimonial>(
    '/api/v1/public/employee-testimonials',
  );
  if (result.error) return result;
  return {
    ...result,
    items: [...result.items].sort((a, b) => a.order - b.order),
  };
}

export async function loadPublishedBlogs(): Promise<PublicListResult<PublicBlogSummary>> {
  return loadPaginated<PublicBlogSummary>('/api/v1/public/blogs');
}

const BLOG_PAGE_SIZE = 10;

export async function loadPublishedBlogPage(
  page = 1,
  q?: string,
): Promise<PublicPageResult<PublicBlogSummary>> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(BLOG_PAGE_SIZE),
  });
  const query = q?.trim();
  if (query) params.set('q', query);
  const { data, error, origin } = await getJson<Paginated<PublicBlogSummary>>(
    `/api/v1/public/blogs?${params.toString()}`,
  );
  if (error || !data) {
    return { items: [], page, per_page: BLOG_PAGE_SIZE, total: 0, error: true, origin };
  }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    page: typeof data.page === 'number' ? data.page : page,
    per_page: typeof data.per_page === 'number' ? data.per_page : BLOG_PAGE_SIZE,
    total: typeof data.total === 'number' ? data.total : 0,
    error: false,
    origin,
  };
}

export async function loadPublishedBlog(slug: string): Promise<PublicItemResult<PublicBlogDetail>> {
  return getJson<PublicBlogDetail>(`/api/v1/public/blogs/${encodeURIComponent(slug)}`).then(
    ({ data, error, origin }) => ({ item: data, error, origin }),
  );
}

const NEWS_PAGE_SIZE = 10;

export async function loadPublishedNewsPage(
  page = 1,
  q?: string,
): Promise<PublicPageResult<PublicNews>> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(NEWS_PAGE_SIZE),
  });
  const query = q?.trim();
  if (query) params.set('q', query);
  const { data, error, origin } = await getJson<Paginated<PublicNews>>(
    `/api/v1/public/news?${params.toString()}`,
  );
  if (error || !data) {
    return { items: [], page, per_page: NEWS_PAGE_SIZE, total: 0, error: true, origin };
  }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    page: typeof data.page === 'number' ? data.page : page,
    per_page: typeof data.per_page === 'number' ? data.per_page : NEWS_PAGE_SIZE,
    total: typeof data.total === 'number' ? data.total : 0,
    error: false,
    origin,
  };
}

export async function loadPublishedNewsCategories(): Promise<PublicListResult<PublicNewsCategory>> {
  return loadPaginated<PublicNewsCategory>('/api/v1/public/news-categories');
}

export async function loadPublishedCategories(): Promise<PublicListResult<PublicCategory>> {
  const { data, error, origin } = await getJson<{ items?: PublicCategory[] }>(
    '/api/v1/public/categories',
  );
  if (error || !data) return { items: [], error: true, origin };
  return { items: Array.isArray(data.items) ? data.items : [], error: false, origin };
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

export async function loadPublishedApplicationDevelopments(): Promise<
  PublicListResult<PublicApplicationDevelopmentSummary>
> {
  return loadPaginated<PublicApplicationDevelopmentSummary>(
    '/api/v1/public/application-development',
  );
}

export async function loadPublishedApplicationDevelopment(
  slug: string,
): Promise<PublicItemResult<PublicApplicationDevelopment>> {
  return getJson<PublicApplicationDevelopment>(
    `/api/v1/public/application-development/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedApplicationModernizations(): Promise<
  PublicListResult<PublicApplicationModernizationSummary>
> {
  return loadPaginated<PublicApplicationModernizationSummary>(
    '/api/v1/public/application-modernization',
  );
}

export async function loadPublishedApplicationModernization(
  slug: string,
): Promise<PublicItemResult<PublicApplicationModernization>> {
  return getJson<PublicApplicationModernization>(
    `/api/v1/public/application-modernization/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedUserCenteredDesigns(): Promise<
  PublicListResult<PublicUserCenteredDesignSummary>
> {
  return loadPaginated<PublicUserCenteredDesignSummary>('/api/v1/public/user-centered-design');
}

export async function loadPublishedUserCenteredDesign(
  slug: string,
): Promise<PublicItemResult<PublicUserCenteredDesign>> {
  return getJson<PublicUserCenteredDesign>(
    `/api/v1/public/user-centered-design/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedMobileApplicationDevelopments(): Promise<
  PublicListResult<PublicMobileApplicationDevelopmentSummary>
> {
  return loadPaginated<PublicMobileApplicationDevelopmentSummary>(
    '/api/v1/public/mobile-application-development',
  );
}

export async function loadPublishedMobileApplicationDevelopment(
  slug: string,
): Promise<PublicItemResult<PublicMobileApplicationDevelopment>> {
  return getJson<PublicMobileApplicationDevelopment>(
    `/api/v1/public/mobile-application-development/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedCloudServices(): Promise<
  PublicListResult<PublicCloudServiceSummary>
> {
  return loadPaginated<PublicCloudServiceSummary>('/api/v1/public/cloud-services');
}

export async function loadPublishedCloudService(
  pageName: string,
): Promise<PublicItemResult<PublicCloudService>> {
  return getJson<PublicCloudService>(
    `/api/v1/public/cloud-services/${encodeURIComponent(pageName)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedDataAnalytics(): Promise<
  PublicListResult<PublicDataAnalyticSummary>
> {
  return loadPaginated<PublicDataAnalyticSummary>('/api/v1/public/data-analytics');
}

export async function loadPublishedDataAnalytic(
  pageName: string,
): Promise<PublicItemResult<PublicDataAnalytic>> {
  return getJson<PublicDataAnalytic>(
    `/api/v1/public/data-analytics/${encodeURIComponent(pageName)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedDigitalTransformations(): Promise<
  PublicListResult<PublicDigitalTransformationSummary>
> {
  return loadPaginated<PublicDigitalTransformationSummary>(
    '/api/v1/public/digital-transformation',
  );
}

export async function loadPublishedDigitalTransformation(
  slug: string,
): Promise<PublicItemResult<PublicDigitalTransformation>> {
  return getJson<PublicDigitalTransformation>(
    `/api/v1/public/digital-transformation/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedDevOpsConsults(): Promise<
  PublicListResult<PublicDevOpsConsultSummary>
> {
  return loadPaginated<PublicDevOpsConsultSummary>('/api/v1/public/devops-consult');
}

export async function loadPublishedDevOpsConsult(
  slug: string,
): Promise<PublicItemResult<PublicDevOpsConsult>> {
  return getJson<PublicDevOpsConsult>(
    `/api/v1/public/devops-consult/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedInfrastructureManagements(): Promise<
  PublicListResult<PublicInfrastructureManagementSummary>
> {
  return loadPaginated<PublicInfrastructureManagementSummary>(
    '/api/v1/public/infrastructure-management',
  );
}

export async function loadPublishedInfrastructureManagement(
  slug: string,
): Promise<PublicItemResult<PublicInfrastructureManagement>> {
  return getJson<PublicInfrastructureManagement>(
    `/api/v1/public/infrastructure-management/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedSolutions(): Promise<PublicListResult<PublicSolution>> {
  const { data, error, origin } = await getJson<{ items?: PublicSolution[] }>(
    '/api/v1/public/solutions',
  );
  if (error) return { items: [], error: true, origin };
  return { items: Array.isArray(data?.items) ? data.items : [], error: false, origin };
}

export async function loadPublishedSolutionProduct(
  slug: string,
): Promise<PublicItemResult<PublicSolutionProduct>> {
  return getJson<PublicSolutionProduct>(
    `/api/v1/public/solution-products/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}

export async function loadPublishedSolutionProducts(): Promise<
  PublicListResult<PublicSolutionProduct>
> {
  const listed = await loadPaginated<PublicSolutionProductSummary>(
    '/api/v1/public/solution-products',
  );
  if (listed.error) return { items: [], error: true, origin: listed.origin };
  const items: PublicSolutionProduct[] = [];
  for (const summary of listed.items) {
    const slug = summary.slug?.trim();
    if (!slug) continue;
    const detail = await loadPublishedSolutionProduct(slug);
    if (detail.error || !detail.item) {
      return { items, error: true, origin: listed.origin };
    }
    items.push(detail.item);
  }
  items.sort((a, b) => a.order - b.order);
  return { items, error: false, origin: listed.origin };
}

export async function loadPublishedSolutionDetail(
  slug: string,
): Promise<PublicItemResult<PublicSolutionDetailsPage>> {
  return getJson<PublicSolutionDetailsPage>(
    `/api/v1/public/solution-details/${encodeURIComponent(slug)}`,
  ).then(({ data, error, origin }) => ({ item: data, error, origin }));
}
