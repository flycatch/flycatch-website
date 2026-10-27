/** Pure helpers for the apply form: payload shaping and error wording. No DOM here, so they are unit-tested. */

/** Same pattern the HRMS uses to hide identity documents from interviewers. */
export const IDENTITY_KIND = /iqama|passport|national\s*id|id\s*proof|emirates|aadhaar|visa/i;

export const STANDARD_NUMERIC = new Set(['exp', 'relExp', 'ctc', 'ectc', 'notice']);

export type RawValue = string | string[] | undefined;

/** Standard fields keep their types: the numeric ones go to the HRMS as numbers, the rest as trimmed text. */
export function shapeStandard(values: Record<string, RawValue>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [id, raw] of Object.entries(values)) {
    const value = (Array.isArray(raw) ? raw.join(', ') : raw ?? '').trim();
    if (!value) continue;
    out[id] = STANDARD_NUMERIC.has(id) ? Number(value) : value;
  }
  return out;
}

export type AnswerSpec = { id: string; type: string; value: RawValue };

/** Custom answers keyed by field id. Empty ones are left out; numbers and multi-selects keep their shape. */
export function shapeAnswers(specs: AnswerSpec[]): Record<string, string | number | string[]> {
  const out: Record<string, string | number | string[]> = {};
  for (const { id, type, value } of specs) {
    if (type === 'file') continue;
    if (Array.isArray(value)) {
      if (value.length) out[id] = value;
      continue;
    }
    const text = (value ?? '').trim();
    if (!text) continue;
    out[id] = type === 'number' || type === 'currency' ? Number(text) : text;
  }
  return out;
}

export type AttachmentSpec = { field?: string; kind: string; identity?: boolean };

export function attachmentFor(kind: string, field?: string): AttachmentSpec {
  return { ...(field ? { field } : {}), kind, ...(IDENTITY_KIND.test(kind) ? { identity: true } : {}) };
}

export type ApiError = {
  status: number;
  code?: string;
  message?: string;
  fields?: Record<string, string>;
  file?: string;
  retryAfterSeconds?: number;
};

export type Friendly = { message: string; fields?: Record<string, string>; alreadyApplied?: boolean };

/** What to tell the visitor for each stable HRMS error code (see docs/ats-careers-api.md). */
export function friendlyError(error: ApiError): Friendly {
  switch (error.code) {
    case 'VALIDATION_FAILED':
      return { message: 'Please check the highlighted answers.', fields: error.fields };
    case 'CONSENT_REQUIRED':
      return { message: 'Please tick the consent box to continue.', fields: { consent: 'Consent is required.' } };
    case 'FILE_REJECTED':
      return { message: error.message || 'One of your files was not accepted. Use PDF, DOC, DOCX, JPG or PNG up to 10 MB.' };
    case 'OPENING_NOT_ACCEPTING':
      return { message: 'This role is no longer accepting applications.' };
    case 'ALREADY_APPLIED':
      return { message: 'You have already applied for this role.', alreadyApplied: true };
    case 'OTP_REQUIRED':
      return { message: 'Please verify your email with the code we send before submitting.' };
    case 'OTP_INVALID':
      return { message: 'That code is wrong or has expired. Request a new one.' };
    case 'RATE_LIMITED': {
      const minutes = error.retryAfterSeconds ? Math.max(1, Math.ceil(error.retryAfterSeconds / 60)) : 0;
      return { message: minutes ? `Too many attempts. Please try again in about ${minutes} minute${minutes > 1 ? 's' : ''}.` : 'Too many attempts. Please try again later.' };
    }
    case 'NOT_ALLOWED':
      return { message: error.message || 'That is not possible right now.' };
    default:
      return { message: error.status === 413 ? 'Your files are too large. Keep the total under 25 MB.' : 'Something went wrong on our side. Please try again shortly.' };
  }
}

/** Whether a conditional question is visible given the answers so far. */
export function isShown(shownWhen: { field: string; equals: string } | undefined, answer: RawValue): boolean {
  if (!shownWhen) return true;
  const values = Array.isArray(answer) ? answer : [answer ?? ''];
  return values.includes(shownWhen.equals);
}
