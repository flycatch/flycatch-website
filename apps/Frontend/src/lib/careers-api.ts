import type { PublicItemResult, PublicListResult, PublicOpening } from './public-api';

/**
 * Server-side client for the HRMS careers API (docs/ats-careers-api.md in flycatch-people).
 * The key lives only in this process: browsers reach the HRMS through /careers-api/*, never directly.
 */

export type CareersLocation = { label: string; country?: string };

export type CareersFormField = {
  id: string;
  type:
    | 'text'
    | 'long'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'yesno'
    | 'file'
    | 'country'
    | 'currency';
  label: { en: string; ar?: string };
  required: boolean;
  help?: string;
  options?: string[];
  pattern?: string;
  min?: number;
  max?: number;
  shownWhen?: { field: string; equals: string };
};

export type CareersForm = {
  version: number;
  standardFields: { id: string; label: string; type: string }[];
  fields: CareersFormField[];
  consent: { version: string; text: string };
  whatsappOffered: boolean;
};

/** Opening as the HRMS returns it. `form` is present on the detail call only. */
export type CareersOpening = {
  id: string;
  code: string;
  title: string;
  department: string | null;
  locations: CareersLocation[];
  workMode: string;
  employmentType: string;
  expMin: number;
  expMax: number;
  qualification: string | null;
  description: string;
  mandatorySkills: string[];
  optionalSkills: string[];
  applyBy: string | null;
  acceptingApplications: boolean;
  datePosted: string | null;
  organisation: string;
  country: string;
  otpRequired: boolean;
  form?: CareersForm;
};

export type ResolvedLink = {
  openingId: string;
  openingCode: string;
  source: string;
  utm: Record<string, string>;
};

export const CAREERS_PATH = '/api/public/careers';

/** Where the browser-facing proxy lives. Not under /api: the gateway sends that to the website backend. */
export const CAREERS_PROXY_PATH = '/careers-api';

export function careersConfig(): { origin: string; key: string } | null {
  const origin = (process.env['PEOPLE_API_ORIGIN'] || import.meta.env.PEOPLE_API_ORIGIN || '').trim();
  const key = (process.env['PEOPLE_CAREERS_KEY'] || import.meta.env.PEOPLE_CAREERS_KEY || '').trim();
  if (!origin || !key) return null;
  return { origin: origin.replace(/\/$/, ''), key };
}

/** The visitor's address as the edge saw it; the HRMS keys its per-visitor limits on it. */
export function visitorIp(headers: Headers, fallback?: string): string | undefined {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || fallback || undefined;
}

export type CareersCall = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  ip?: string;
  signal?: AbortSignal;
};

/** Calls the HRMS with the key attached. Throws when the integration is not configured or unreachable. */
export async function careersFetch(path: string, call: CareersCall = {}): Promise<Response> {
  const config = careersConfig();
  if (!config) throw new Error('Careers integration is not configured');
  const headers: Record<string, string> = { ...call.headers, 'X-Careers-Key': config.key };
  if (call.ip) headers['X-Forwarded-Client-Ip'] = call.ip;
  const init: RequestInit & { duplex?: 'half' } = {
    method: call.method ?? 'GET',
    headers,
    signal: call.signal ?? AbortSignal.timeout(30_000),
  };
  if (call.body != null) {
    init.body = call.body;
    init.duplex = 'half';
  }
  return fetch(`${config.origin}${CAREERS_PATH}${path}`, init);
}

async function getJson<T>(path: string, ip?: string): Promise<{ data: T | null; error: boolean }> {
  try {
    const response = await careersFetch(path, { ip, headers: { Accept: 'application/json' } });
    // A 404 is a clean miss (unknown, draft, closed). Anything else non-2xx is a failure worth a 503.
    if (response.status === 404) return { data: null, error: false };
    if (!response.ok) return { data: null, error: true };
    return { data: (await response.json()) as T, error: false };
  } catch {
    return { data: null, error: true };
  }
}

function experienceLabel(min: number, max: number): string {
  if (max <= min) return `${min} Years`;
  return `${min}-${max} Years`;
}

function locationLabel(locations: CareersLocation[], workMode: string): string {
  const places = locations.map((l) => l.label).filter(Boolean).join(', ');
  return places || workMode;
}

/** Maps the HRMS shape onto the one the listing, detail page, sitemap and JSON-LD already render. */
export function toPublicOpening(source: CareersOpening): PublicOpening {
  return {
    job_id: source.code,
    exp_date: source.applyBy,
    role: source.title,
    slug: source.code,
    experience: experienceLabel(source.expMin, source.expMax),
    location: locationLabel(source.locations, source.workMode),
    job_type: source.employmentType,
    job_status: source.acceptingApplications ? 'Open' : 'On hold',
    specialization: source.department ?? 'Other',
    body: source.description,
    careers: source,
  };
}

export async function loadCareersOpenings(origin: string): Promise<PublicListResult<PublicOpening>> {
  const { data, error } = await getJson<CareersOpening[]>('/openings');
  if (error || !Array.isArray(data)) return { items: [], error: true, origin };
  return { items: data.map(toPublicOpening), error: false, origin };
}

export async function loadCareersOpening(
  idOrCode: string,
  origin: string,
  ip?: string,
): Promise<PublicItemResult<PublicOpening>> {
  const { data, error } = await getJson<CareersOpening>(`/openings/${encodeURIComponent(idOrCode)}`, ip);
  return { item: data ? toPublicOpening(data) : null, error, origin };
}

/** Counts a click and returns the opening and source. Null for an unknown or closed link. */
export async function resolveCareersLink(code: string, ip?: string): Promise<{ link: ResolvedLink | null; error: boolean }> {
  const { data, error } = await getJson<ResolvedLink>(`/links/${encodeURIComponent(code)}`, ip);
  return { link: data, error };
}

/** Cookie that carries a short link's source from the click to the application. */
export const SOURCE_COOKIE = 'fc_job_source';
export const SOURCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;
