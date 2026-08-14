const API_BASE = (import.meta.env.PUBLIC_ORIGIN || 'http://localhost:8080') + '/api/v1';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw Object.assign(new Error('API error'), { status: response.status, detail });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function signIn(email: string, password: string): Promise<void> {
  await api<void>('/admin/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signOut(): Promise<void> {
  await api<void>('/admin/auth/sign-out', { method: 'POST' });
}

export async function getSession() {
  return api<{ administrator_id: string; email: string; idle_expires_at: string }>(
    '/admin/auth/session',
  );
}

export async function getCsrfToken(): Promise<string> {
  const data = await api<{ token: string }>('/admin/csrf');
  return data.token;
}

export async function getSiteSettingsRecord() {
  return api('/admin/site-settings');
}

export async function saveSiteSettingsDraft(payload: unknown, csrf: string) {
  return api('/admin/site-settings', {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': csrf },
    body: JSON.stringify(payload),
  });
}

export async function getPageRecord(slug: string) {
  return api(`/admin/pages/${slug}`);
}

export async function savePageDraft(slug: string, payload: unknown, csrf: string) {
  return api(`/admin/pages/${slug}`, {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': csrf },
    body: JSON.stringify(payload),
  });
}

export async function publishRecord(type: string, slug: string, csrf: string) {
  return api('/admin/publish', {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrf },
    body: JSON.stringify({ type, slug }),
  });
}
