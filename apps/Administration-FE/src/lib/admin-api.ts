import type { components as AuthComponents } from '../generated/admin-auth.v2';
import type { components as RbacComponents } from '../generated/admin-rbac.v1';
import type { components as RolesComponents } from '../generated/admin-roles.v1';
import type { components as BlogsComponents } from '../generated/admin-blogs.v1';
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
  return { message_key: 'admin.sign_in.error' };
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

export function hasPermission(session: SessionContext | null, permission: PermissionName): boolean {
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
