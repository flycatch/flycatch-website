import type { components as AuthComponents } from '../generated/admin-auth.v2';
import type { components as RbacComponents } from '../generated/admin-rbac.v1';
import type { components as RolesComponents } from '../generated/admin-roles.v1';
import type { components as BlogsComponents } from '../generated/admin-blogs.v1';
import type { components as CaseStudiesComponents } from '../generated/admin-case-studies.v1';
import type { components as ClientLogosComponents } from '../generated/admin-client-logos.v1';
import type { components as ClientTestimonialsComponents } from '../generated/admin-client-testimonials.v1';
import type { components as HomesComponents } from '../generated/admin-homes.v1';
import type { components as SolutionsComponents } from '../generated/admin-solutions.v1';
import type { components as SolutionDetailsComponents } from '../generated/admin-solution-details.v1';
import type { components as SolutionProductsComponents } from '../generated/admin-solution-products.v1';
import type { components as AiServicesComponents } from '../generated/admin-ai-services.v1';
import type { components as CloudServicesComponents } from '../generated/admin-cloud-services.v1';
import type { components as DataAnalyticsComponents } from '../generated/admin-data-analytics.v1';
import type { components as DigitalTransformationComponents } from '../generated/admin-digital-transformation.v1';
import type { components as DevOpsConsultComponents } from '../generated/admin-devops-consult.v1';
import type { components as InfrastructureManagementComponents } from '../generated/admin-infrastructure-management.v1';
import type { components as ApplicationDevelopmentComponents } from '../generated/admin-application-development.v1';
import type { components as ApplicationModernizationComponents } from '../generated/admin-application-modernization.v1';
import type { components as MobileApplicationDevelopmentComponents } from '../generated/admin-mobile-application-development.v1';
import type { components as UserCenteredDesignComponents } from '../generated/admin-user-centered-design.v1';
import type { components as OverviewComponents } from '../generated/admin-overview.v1';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './token-store';
import { t } from './i18n';

const API_BASE = (import.meta.env.PUBLIC_ORIGIN || 'http://localhost:8080') + '/api/v1';

export type TokenPair = AuthComponents['schemas']['TokenPair'];
export type SessionContext = AuthComponents['schemas']['SessionContext'];
export type PermissionName = RbacComponents['schemas']['PermissionName'];
export type AuthError = AuthComponents['schemas']['AuthError'];
export type PermissionDenied = RbacComponents['schemas']['PermissionDenied'];
export type RoleList = RolesComponents['schemas']['RoleList'];
export type RoleDetail = RolesComponents['schemas']['RoleDetail'];
export type RoleWrite = RolesComponents['schemas']['RoleWrite'];
export type RoleCatalogue = RolesComponents['schemas']['RoleCatalogue'];
export type BlogList = BlogsComponents['schemas']['BlogList'];
export type BlogDetail = BlogsComponents['schemas']['BlogDetail'];
export type BlogWrite = BlogsComponents['schemas']['BlogWrite'];
export type Author = BlogsComponents['schemas']['Author'];
export type AuthorList = BlogsComponents['schemas']['AuthorList'];
export type AuthorWrite = BlogsComponents['schemas']['AuthorWrite'];
export type Category = BlogsComponents['schemas']['Category'];
export type CategoryList = BlogsComponents['schemas']['CategoryList'];
export type CategoryWrite = BlogsComponents['schemas']['CategoryWrite'];
export type MediaObject = BlogsComponents['schemas']['MediaObject'];
export type CaseStudyList = CaseStudiesComponents['schemas']['CaseStudyList'];
export type CaseStudySummary = CaseStudiesComponents['schemas']['CaseStudySummary'];
export type CaseStudyDetail = CaseStudiesComponents['schemas']['CaseStudyDetail'];
export type CaseStudyWrite = CaseStudiesComponents['schemas']['CaseStudyWrite'];
export type Industry = CaseStudiesComponents['schemas']['Industry'];
export type IndustryList = CaseStudiesComponents['schemas']['IndustryList'];
export type IndustryWrite = CaseStudiesComponents['schemas']['IndustryWrite'];
export type CaseStudyCategory = CaseStudiesComponents['schemas']['CaseStudyCategory'];
export type CaseStudyCategoryList = CaseStudiesComponents['schemas']['CaseStudyCategoryList'];
export type CaseStudyCategoryWrite = CaseStudiesComponents['schemas']['CaseStudyCategoryWrite'];
export type Technology = CaseStudiesComponents['schemas']['Technology'];
export type TechnologyList = CaseStudiesComponents['schemas']['TechnologyList'];
export type TechnologyWrite = CaseStudiesComponents['schemas']['TechnologyWrite'];
export type ClientLogo = ClientLogosComponents['schemas']['ClientLogo'];
export type ClientLogoList = ClientLogosComponents['schemas']['ClientLogoList'];
export type ClientLogoWrite = ClientLogosComponents['schemas']['ClientLogoWrite'];
export type ClientTestimonial = ClientTestimonialsComponents['schemas']['ClientTestimonial'];
export type ClientTestimonialList = ClientTestimonialsComponents['schemas']['ClientTestimonialList'];
export type ClientTestimonialWrite = ClientTestimonialsComponents['schemas']['ClientTestimonialWrite'];
export type Home = HomesComponents['schemas']['Home'];
export type HomeList = HomesComponents['schemas']['HomeList'];
export type HomeWrite = HomesComponents['schemas']['HomeWrite'];
export type ContentSeo = HomesComponents['schemas']['ContentSeo'];
export type HomeServiceItem = HomesComponents['schemas']['HomeService'];
export type HomeFaqItem = HomesComponents['schemas']['HomeFaq'];
export type Solution = SolutionsComponents['schemas']['Solution'];
export type SolutionList = SolutionsComponents['schemas']['SolutionList'];
export type SolutionWrite = SolutionsComponents['schemas']['SolutionWrite'];
export type SolutionDetail = SolutionDetailsComponents['schemas']['SolutionDetail'];
export type SolutionDetailList = SolutionDetailsComponents['schemas']['SolutionDetailList'];
export type SolutionDetailWrite = SolutionDetailsComponents['schemas']['SolutionDetailWrite'];
export type SolutionProduct = SolutionProductsComponents['schemas']['SolutionProduct'];
export type SolutionProductList = SolutionProductsComponents['schemas']['SolutionProductList'];
export type SolutionProductWrite = SolutionProductsComponents['schemas']['SolutionProductWrite'];
export type AiService = AiServicesComponents['schemas']['AiService'];
export type AiServiceList = AiServicesComponents['schemas']['AiServiceList'];
export type AiServiceWrite = AiServicesComponents['schemas']['AiServiceWrite'];
export type CloudService = CloudServicesComponents['schemas']['CloudService'];
export type CloudServiceList = CloudServicesComponents['schemas']['CloudServiceList'];
export type CloudServiceWrite = CloudServicesComponents['schemas']['CloudServiceWrite'];
export type DataAnalytic = DataAnalyticsComponents['schemas']['DataAnalytic'];
export type DataAnalyticList = DataAnalyticsComponents['schemas']['DataAnalyticList'];
export type DataAnalyticWrite = DataAnalyticsComponents['schemas']['DataAnalyticWrite'];
export type DigitalTransformation = DigitalTransformationComponents['schemas']['DigitalTransformation'];
export type DigitalTransformationList = DigitalTransformationComponents['schemas']['DigitalTransformationList'];
export type DigitalTransformationWrite = DigitalTransformationComponents['schemas']['DigitalTransformationWrite'];
export type DevOpsConsult = DevOpsConsultComponents['schemas']['DevOpsConsult'];
export type InfrastructureManagement = InfrastructureManagementComponents['schemas']['InfrastructureManagement'];
export type ApplicationDevelopment = ApplicationDevelopmentComponents['schemas']['ApplicationDevelopment'];
export type ApplicationModernization = ApplicationModernizationComponents['schemas']['ApplicationModernization'];
export type MobileApplicationDevelopment =
  MobileApplicationDevelopmentComponents['schemas']['MobileApplicationDevelopment'];
export type UserCenteredDesign = UserCenteredDesignComponents['schemas']['UserCenteredDesign'];
export type OverviewEntry = OverviewComponents['schemas']['Overview'];

export type LandingAccordionItem = { title: string; contents: string; order: number };

export type LandingWritePayload = {
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  introduction_first_paragraph: string;
  introduction_second_paragraph: string;
  introduction_third_paragraph?: string;
  accordion?: LandingAccordionItem[];
  experience_title?: string;
  experience_accordion?: LandingAccordionItem[];
  experience_image_key?: string | null;
  experience_description?: string;
  offering_image_key?: string | null;
  offering_title?: string;
  offering_description?: string;
  faq_title?: string;
  faq_description?: string;
  faq_accordion?: LandingAccordionItem[];
  seo: ContentSeo;
  status: 'draft' | 'publish';
};

export type LandingDetail = LandingWritePayload & {
  id: string;
  slug: string;
  content_available_in?: string[];
};

export type LandingSummary = {
  id: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title?: string;
  introduction_first_paragraph?: string;
  content_available_in?: string;
  seo?: string;
  state: 'draft' | 'publish';
};

export type LandingListPayload = {
  items: LandingSummary[];
  page: number;
  per_page: number;
  total: number;
};

export class AdminApiError extends Error {
  status: number;
  detail: AuthError | PermissionDenied | { message_key?: string; fields?: Record<string, { message_key: string }> };

  constructor(
    status: number,
    detail: AdminApiError['detail'],
  ) {
    super('API error');
    this.status = status;
    this.detail = detail;
  }
}

function errorBody(payload: unknown): AdminApiError['detail'] {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (record.detail && typeof record.detail === 'object') {
      return record.detail as AdminApiError['detail'];
    }
    return record as AdminApiError['detail'];
  }
  return { message_key: 'admin.workspace.request_failed' };
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(`${API_BASE}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        clearTokens();
        return false;
      }
      const pair = (await response.json()) as TokenPair;
      setTokens(pair.access_token, pair.refresh_token);
      return true;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!headers.has('Content-Type') && options.body && !isForm) {
    headers.set('Content-Type', 'application/json');
  }
  const access = getAccessToken();
  if (access) {
    headers.set('Authorization', `Bearer ${access}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry && path !== '/admin/auth/refresh' && path !== '/admin/auth/sign-in') {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return api<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new AdminApiError(response.status, errorBody(payload));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function signIn(email: string, password: string): Promise<TokenPair> {
  const pair = await api<TokenPair>('/admin/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(pair.access_token, pair.refresh_token);
  return pair;
}

export async function signOut(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await api<void>('/admin/auth/sign-out', {
      method: 'POST',
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
    });
  } finally {
    clearTokens();
  }
}

export async function getSession(): Promise<SessionContext> {
  return api<SessionContext>('/admin/auth/session');
}

export async function getSiteSettingsRecord() {
  return api('/admin/site-settings');
}

export async function saveSiteSettingsDraft(payload: unknown) {
  return api('/admin/site-settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getPageRecord(slug: string) {
  return api(`/admin/pages/${slug}`);
}

export async function savePageDraft(slug: string, payload: unknown) {
  return api(`/admin/pages/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function publishRecord(type: string, slug: string) {
  return api('/admin/publish', {
    method: 'POST',
    body: JSON.stringify({ type, slug }),
  });
}

export function hasPermission(
  session: SessionContext | null,
  permission: PermissionName | string,
): boolean {
  return Boolean(session?.permissions?.includes(permission));
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export async function listRoles(q: string, page: number): Promise<RoleList> {
  return api<RoleList>(`/admin/roles${queryString({ q: q.trim() || undefined, page, per_page: 5 })}`);
}

export async function getRoleCatalogue(): Promise<RoleCatalogue> {
  return api<RoleCatalogue>('/admin/roles/catalogue');
}

export async function getRole(id: string): Promise<RoleDetail> {
  return api<RoleDetail>(`/admin/roles/${id}`);
}

export async function createRole(payload: RoleWrite): Promise<RoleDetail> {
  return api<RoleDetail>('/admin/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRole(id: string, payload: RoleWrite): Promise<RoleDetail> {
  return api<RoleDetail>(`/admin/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteRole(id: string): Promise<void> {
  await api<void>(`/admin/roles/${id}`, { method: 'DELETE' });
}

export async function listBlogs(q: string, page: number): Promise<BlogList> {
  return api<BlogList>(`/admin/blogs${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`);
}

export async function getBlog(id: string): Promise<BlogDetail> {
  return api<BlogDetail>(`/admin/blogs/${id}`);
}

export async function createBlog(payload: BlogWrite): Promise<BlogDetail> {
  return api<BlogDetail>('/admin/blogs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBlog(id: string, payload: BlogWrite): Promise<BlogDetail> {
  return api<BlogDetail>(`/admin/blogs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteBlog(id: string): Promise<void> {
  await api<void>(`/admin/blogs/${id}`, { method: 'DELETE' });
}

export async function listAuthors(): Promise<AuthorList> {
  return api<AuthorList>('/admin/authors');
}

export async function getAuthor(id: string): Promise<Author> {
  return api<Author>(`/admin/authors/${id}`);
}

export async function createAuthor(payload: AuthorWrite): Promise<Author> {
  return api<Author>('/admin/authors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAuthor(id: string, payload: AuthorWrite): Promise<Author> {
  return api<Author>(`/admin/authors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAuthor(id: string): Promise<void> {
  await api<void>(`/admin/authors/${id}`, { method: 'DELETE' });
}

export async function listCategories(): Promise<CategoryList> {
  return api<CategoryList>('/admin/categories');
}

export async function getCategory(id: string): Promise<Category> {
  return api<Category>(`/admin/categories/${id}`);
}

export async function createCategory(payload: CategoryWrite): Promise<Category> {
  return api<Category>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id: string, payload: CategoryWrite): Promise<Category> {
  return api<Category>(`/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await api<void>(`/admin/categories/${id}`, { method: 'DELETE' });
}

export async function listCaseStudies(q: string, page: number): Promise<CaseStudyList> {
  return api<CaseStudyList>(
    `/admin/case-studies${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getCaseStudy(id: string): Promise<CaseStudyDetail> {
  return api<CaseStudyDetail>(`/admin/case-studies/${id}`);
}

export async function createCaseStudy(payload: CaseStudyWrite): Promise<CaseStudyDetail> {
  return api<CaseStudyDetail>('/admin/case-studies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCaseStudy(id: string, payload: CaseStudyWrite): Promise<CaseStudyDetail> {
  return api<CaseStudyDetail>(`/admin/case-studies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCaseStudy(id: string): Promise<void> {
  await api<void>(`/admin/case-studies/${id}`, { method: 'DELETE' });
}

export async function listIndustries(q: string, page: number): Promise<IndustryList> {
  return api<IndustryList>(
    `/admin/industries${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function listAllIndustries(): Promise<Industry[]> {
  const items: Industry[] = [];
  let page = 1;
  while (true) {
    const result = await listIndustries('', page);
    for (const row of result.items) {
      items.push({
        id: row.id,
        name: row.name,
        status: row.state,
        created_at: row.created_at,
      });
    }
    if (page * result.per_page >= result.total) break;
    page += 1;
  }
  return items;
}

export async function getIndustry(id: string): Promise<Industry> {
  return api<Industry>(`/admin/industries/${id}`);
}

export async function createIndustry(payload: IndustryWrite): Promise<Industry> {
  return api<Industry>('/admin/industries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateIndustry(id: string, payload: IndustryWrite): Promise<Industry> {
  return api<Industry>(`/admin/industries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteIndustry(id: string): Promise<void> {
  await api<void>(`/admin/industries/${id}`, { method: 'DELETE' });
}

export async function listCaseStudyCategories(
  q: string,
  page: number,
): Promise<CaseStudyCategoryList> {
  return api<CaseStudyCategoryList>(
    `/admin/case-study-categories${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function listAllCaseStudyCategories(): Promise<CaseStudyCategory[]> {
  const items: CaseStudyCategory[] = [];
  let page = 1;
  while (true) {
    const result = await listCaseStudyCategories('', page);
    for (const row of result.items) {
      items.push({
        id: row.id,
        name: row.name,
        status: row.state,
        created_at: row.created_at,
        case_studies: row.case_studies,
      });
    }
    if (page * result.per_page >= result.total) break;
    page += 1;
  }
  return items;
}

export async function getCaseStudyCategory(id: string): Promise<CaseStudyCategory> {
  return api<CaseStudyCategory>(`/admin/case-study-categories/${id}`);
}

export async function createCaseStudyCategory(
  payload: CaseStudyCategoryWrite,
): Promise<CaseStudyCategory> {
  return api<CaseStudyCategory>('/admin/case-study-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCaseStudyCategory(
  id: string,
  payload: CaseStudyCategoryWrite,
): Promise<CaseStudyCategory> {
  return api<CaseStudyCategory>(`/admin/case-study-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCaseStudyCategory(id: string): Promise<void> {
  await api<void>(`/admin/case-study-categories/${id}`, { method: 'DELETE' });
}

export async function listTechnologies(q: string, page: number): Promise<TechnologyList> {
  return api<TechnologyList>(
    `/admin/technologies${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function listPublishedTechnologies(): Promise<Technology[]> {
  const items: Technology[] = [];
  let page = 1;
  while (true) {
    const result = await listTechnologies('', page);
    for (const row of result.items) {
      if (row.state !== 'publish') continue;
      items.push({
        id: row.id,
        name: row.name,
        logo_key: row.logo_key,
        status: row.state,
        created_at: row.created_at,
      });
    }
    if (page * result.per_page >= result.total) break;
    page += 1;
  }
  return items;
}

export async function getTechnology(id: string): Promise<Technology> {
  return api<Technology>(`/admin/technologies/${id}`);
}

export async function createTechnology(payload: TechnologyWrite): Promise<Technology> {
  return api<Technology>('/admin/technologies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTechnology(id: string, payload: TechnologyWrite): Promise<Technology> {
  return api<Technology>(`/admin/technologies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTechnology(id: string): Promise<void> {
  await api<void>(`/admin/technologies/${id}`, { method: 'DELETE' });
}

export async function listClientLogos(q: string, page: number): Promise<ClientLogoList> {
  return api<ClientLogoList>(
    `/admin/client-logos${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getClientLogo(id: string): Promise<ClientLogo> {
  return api<ClientLogo>(`/admin/client-logos/${id}`);
}

export async function createClientLogo(payload: ClientLogoWrite): Promise<ClientLogo> {
  return api<ClientLogo>('/admin/client-logos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateClientLogo(id: string, payload: ClientLogoWrite): Promise<ClientLogo> {
  return api<ClientLogo>(`/admin/client-logos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteClientLogo(id: string): Promise<void> {
  await api<void>(`/admin/client-logos/${id}`, { method: 'DELETE' });
}

export async function listClientTestimonials(
  q: string,
  page: number,
): Promise<ClientTestimonialList> {
  return api<ClientTestimonialList>(
    `/admin/client-testimonials${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getClientTestimonial(id: string): Promise<ClientTestimonial> {
  return api<ClientTestimonial>(`/admin/client-testimonials/${id}`);
}

export async function createClientTestimonial(
  payload: ClientTestimonialWrite,
): Promise<ClientTestimonial> {
  return api<ClientTestimonial>('/admin/client-testimonials', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateClientTestimonial(
  id: string,
  payload: ClientTestimonialWrite,
): Promise<ClientTestimonial> {
  return api<ClientTestimonial>(`/admin/client-testimonials/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteClientTestimonial(id: string): Promise<void> {
  await api<void>(`/admin/client-testimonials/${id}`, { method: 'DELETE' });
}

export async function listHomes(q: string, page: number): Promise<HomeList> {
  return api<HomeList>(`/admin/homes${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`);
}

export async function getHome(id: string): Promise<Home> {
  return api<Home>(`/admin/homes/${id}`);
}

export async function createHome(payload: HomeWrite): Promise<Home> {
  return api<Home>('/admin/homes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateHome(id: string, payload: HomeWrite): Promise<Home> {
  return api<Home>(`/admin/homes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteHome(id: string): Promise<void> {
  await api<void>(`/admin/homes/${id}`, { method: 'DELETE' });
}

export async function listSolutions(q: string, page: number): Promise<SolutionList> {
  return api<SolutionList>(
    `/admin/solutions${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getSolution(id: string): Promise<Solution> {
  return api<Solution>(`/admin/solutions/${id}`);
}

export async function createSolution(payload: SolutionWrite): Promise<Solution> {
  return api<Solution>('/admin/solutions', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateSolution(id: string, payload: SolutionWrite): Promise<Solution> {
  return api<Solution>(`/admin/solutions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteSolution(id: string): Promise<void> {
  await api<void>(`/admin/solutions/${id}`, { method: 'DELETE' });
}

export async function listSolutionDetails(q: string, page: number): Promise<SolutionDetailList> {
  return api<SolutionDetailList>(
    `/admin/solution-details${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getSolutionDetail(id: string): Promise<SolutionDetail> {
  return api<SolutionDetail>(`/admin/solution-details/${id}`);
}

export async function createSolutionDetail(payload: SolutionDetailWrite): Promise<SolutionDetail> {
  return api<SolutionDetail>('/admin/solution-details', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSolutionDetail(
  id: string,
  payload: SolutionDetailWrite,
): Promise<SolutionDetail> {
  return api<SolutionDetail>(`/admin/solution-details/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSolutionDetail(id: string): Promise<void> {
  await api<void>(`/admin/solution-details/${id}`, { method: 'DELETE' });
}

export async function listSolutionProducts(q: string, page: number): Promise<SolutionProductList> {
  return api<SolutionProductList>(
    `/admin/solution-products${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getSolutionProduct(id: string): Promise<SolutionProduct> {
  return api<SolutionProduct>(`/admin/solution-products/${id}`);
}

export async function createSolutionProduct(
  payload: SolutionProductWrite,
): Promise<SolutionProduct> {
  return api<SolutionProduct>('/admin/solution-products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSolutionProduct(
  id: string,
  payload: SolutionProductWrite,
): Promise<SolutionProduct> {
  return api<SolutionProduct>(`/admin/solution-products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSolutionProduct(id: string): Promise<void> {
  await api<void>(`/admin/solution-products/${id}`, { method: 'DELETE' });
}

export async function listAiServices(q: string, page: number): Promise<AiServiceList> {
  return api<AiServiceList>(
    `/admin/ai-services${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getAiService(id: string): Promise<AiService> {
  return api<AiService>(`/admin/ai-services/${id}`);
}

export async function createAiService(payload: AiServiceWrite): Promise<AiService> {
  return api<AiService>('/admin/ai-services', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAiService(id: string, payload: AiServiceWrite): Promise<AiService> {
  return api<AiService>(`/admin/ai-services/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteAiService(id: string): Promise<void> {
  await api<void>(`/admin/ai-services/${id}`, { method: 'DELETE' });
}

export async function listCloudServices(q: string, page: number): Promise<CloudServiceList> {
  return api<CloudServiceList>(
    `/admin/cloud-services${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getCloudService(id: string): Promise<CloudService> {
  return api<CloudService>(`/admin/cloud-services/${id}`);
}

export async function createCloudService(payload: CloudServiceWrite): Promise<CloudService> {
  return api<CloudService>('/admin/cloud-services', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCloudService(id: string, payload: CloudServiceWrite): Promise<CloudService> {
  return api<CloudService>(`/admin/cloud-services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCloudService(id: string): Promise<void> {
  await api<void>(`/admin/cloud-services/${id}`, { method: 'DELETE' });
}

export async function listDataAnalytics(q: string, page: number): Promise<DataAnalyticList> {
  return api<DataAnalyticList>(
    `/admin/data-analytics${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getDataAnalytic(id: string): Promise<DataAnalytic> {
  return api<DataAnalytic>(`/admin/data-analytics/${id}`);
}

export async function createDataAnalytic(payload: DataAnalyticWrite): Promise<DataAnalytic> {
  return api<DataAnalytic>('/admin/data-analytics', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateDataAnalytic(id: string, payload: DataAnalyticWrite): Promise<DataAnalytic> {
  return api<DataAnalytic>(`/admin/data-analytics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDataAnalytic(id: string): Promise<void> {
  await api<void>(`/admin/data-analytics/${id}`, { method: 'DELETE' });
}

export async function listDigitalTransformations(
  q: string,
  page: number,
): Promise<DigitalTransformationList> {
  return api<DigitalTransformationList>(
    `/admin/digital-transformation${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getDigitalTransformation(id: string): Promise<DigitalTransformation> {
  return api<DigitalTransformation>(`/admin/digital-transformation/${id}`);
}

export async function createDigitalTransformation(
  payload: DigitalTransformationWrite,
): Promise<DigitalTransformation> {
  return api<DigitalTransformation>('/admin/digital-transformation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDigitalTransformation(
  id: string,
  payload: DigitalTransformationWrite,
): Promise<DigitalTransformation> {
  return api<DigitalTransformation>(`/admin/digital-transformation/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDigitalTransformation(id: string): Promise<void> {
  await api<void>(`/admin/digital-transformation/${id}`, { method: 'DELETE' });
}

export async function listLandings(
  path: string,
  q: string,
  page: number,
): Promise<LandingListPayload> {
  return api<LandingListPayload>(
    `${path}${queryString({ q: q.trim() || undefined, page, per_page: 10 })}`,
  );
}

export async function getLanding(path: string, id: string): Promise<LandingDetail> {
  return api<LandingDetail>(`${path}/${id}`);
}

export async function createLanding(path: string, payload: LandingWritePayload): Promise<LandingDetail> {
  return api<LandingDetail>(path, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateLanding(
  path: string,
  id: string,
  payload: LandingWritePayload,
): Promise<LandingDetail> {
  return api<LandingDetail>(`${path}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteLanding(path: string, id: string): Promise<void> {
  await api<void>(`${path}/${id}`, { method: 'DELETE' });
}

export function apiErrorMessage(caught: unknown, fallback = 'admin.workspace.request_failed'): string {
  if (caught instanceof AdminApiError) {
    const detail = caught.detail as {
      message_key?: string;
      permission?: string;
      fields?: Record<string, { message_key: string }>;
    };
    if (caught.status === 403 || Boolean(detail.permission)) {
      return t('admin.action.forbidden');
    }
    const fieldKey = detail.fields ? Object.values(detail.fields)[0]?.message_key : undefined;
    if (fieldKey) return t(fieldKey);
    if (detail.message_key) return t(detail.message_key);
  }
  return t(fallback);
}

export async function uploadMedia(file: File): Promise<MediaObject> {
  const body = new FormData();
  body.append('file', file);
  return api<MediaObject>('/admin/media', { method: 'POST', body });
}

async function apiBlob(path: string, retry = true): Promise<Blob> {
  const headers = new Headers();
  const access = getAccessToken();
  if (access) {
    headers.set('Authorization', `Bearer ${access}`);
  }
  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (response.status === 401 && retry && path !== '/admin/auth/refresh') {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return apiBlob(path, false);
    }
  }
  if (!response.ok) {
    throw new AdminApiError(response.status, { message_key: 'admin.workspace.request_failed' });
  }
  return response.blob();
}

export async function fetchMediaBlob(key: string): Promise<Blob> {
  return apiBlob(`/admin/media/${encodeURIComponent(key)}`);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
