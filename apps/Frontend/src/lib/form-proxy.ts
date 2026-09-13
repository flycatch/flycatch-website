import { fetchOrigin } from './public-api';

export type FormFieldErrors = Record<string, string>;

export type FormProxyResult = {
  ok: boolean;
  status: number;
  fields: FormFieldErrors;
  body: Record<string, unknown>;
};

const MESSAGE_KEYS: Record<string, string> = {
  'admin.field.required': 'form.error.required',
  'admin.field.invalid': 'form.error.invalid',
  'public.bot_detected': 'form.error.bot',
  'public.subscriptions.email.duplicate': 'footer.subscribe_duplicate',
  'admin.media.type.invalid': 'form.error.file_type',
};

export function messageKeyForField(key: string | undefined): string {
  if (!key) return 'form.error.invalid';
  return MESSAGE_KEYS[key] || (key.includes('duplicate') ? 'footer.subscribe_duplicate' : 'form.error.invalid');
}

export function fieldErrorsFromBody(body: unknown): FormFieldErrors {
  if (!body || typeof body !== 'object') return {};
  const record = body as Record<string, unknown>;
  const raw =
    (record.fields as Record<string, { message_key?: string }> | undefined) ||
    ((record.detail as Record<string, unknown> | undefined)?.fields as
      | Record<string, { message_key?: string }>
      | undefined);
  if (!raw) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([field, value]) => [field, messageKeyForField(value?.message_key)]),
  );
}

export function conversionEvent(formId: string, extra: Record<string, string> = {}): Record<string, string> {
  return { event: 'form_submit', form_id: formId, ...extra };
}

export async function postPublicJson(path: string, payload: unknown): Promise<FormProxyResult> {
  try {
    const response = await fetch(`${fetchOrigin()}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await readJson(response);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      fields: fieldErrorsFromBody(body),
      body,
    };
  } catch {
    return { ok: false, status: 503, fields: {}, body: {} };
  }
}

export async function postPublicMultipart(path: string, data: FormData): Promise<FormProxyResult> {
  try {
    const response = await fetch(`${fetchOrigin()}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
    });
    const body = await readJson(response);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      fields: fieldErrorsFromBody(body),
      body,
    };
  } catch {
    return { ok: false, status: 503, fields: {}, body: {} };
  }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const parsed = await response.json();
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function wantsJson(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  return accept.includes('application/json') || request.headers.get('x-requested-with') === 'fetch';
}

export function safeReturnTo(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
