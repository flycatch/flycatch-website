import type { components as AuthComponents } from '../generated/admin-auth.v2';
import type { components as RbacComponents } from '../generated/admin-rbac.v1';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './token-store';

const API_BASE = (import.meta.env.PUBLIC_ORIGIN || 'http://localhost:8080') + '/api/v1';

export type TokenPair = AuthComponents['schemas']['TokenPair'];
export type SessionContext = AuthComponents['schemas']['SessionContext'];
export type PermissionName = RbacComponents['schemas']['PermissionName'];
export type AuthError = AuthComponents['schemas']['AuthError'];
export type PermissionDenied = RbacComponents['schemas']['PermissionDenied'];

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
  if (!headers.has('Content-Type') && options.body) {
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
