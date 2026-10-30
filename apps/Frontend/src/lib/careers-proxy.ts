import { careersFetch, careersConfig, visitorIp } from './careers-api';

/** Request body ceiling for an application: 25 MB of files plus the form fields (the HRMS gateway allows 26 MB). */
export const MAX_APPLICATION_BYTES = 26 * 1024 * 1024;
const MAX_JSON_BYTES = 12 * 1024;

type Route = { method: 'GET' | 'POST'; pattern: RegExp; maxBytes: number; forwardToken?: boolean };

/** The only HRMS calls a browser may make through the proxy. Everything else is a 404. */
const ROUTES: Route[] = [
  { method: 'POST', pattern: /^openings\/[0-9a-f-]{36}\/applications$/i, maxBytes: MAX_APPLICATION_BYTES },
  { method: 'POST', pattern: /^otp$/, maxBytes: MAX_JSON_BYTES },
  { method: 'POST', pattern: /^otp\/verify$/, maxBytes: MAX_JSON_BYTES },
  { method: 'GET', pattern: /^status$/, maxBytes: 0, forwardToken: true },
  { method: 'POST', pattern: /^applications\/[A-Za-z0-9-]{1,40}\/withdraw$/, maxBytes: 0, forwardToken: true },
  { method: 'POST', pattern: /^data-deletion$/, maxBytes: 0, forwardToken: true },
];

export function matchRoute(method: string, path: string): Route | null {
  return ROUTES.find((r) => r.method === method && r.pattern.test(path)) ?? null;
}

const json = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

/** Upstream 401 UNAUTHORIZED means our key is wrong. That is not the visitor's problem and not worth echoing. */
const UNAVAILABLE = { code: 'UNAVAILABLE', message: 'Applications are temporarily unavailable. Please try again shortly.' };

export async function proxyCareers(request: Request, path: string, clientAddress?: string): Promise<Response> {
  const route = matchRoute(request.method, path);
  if (!route) return json(404, { code: 'NOT_FOUND', message: 'Not found' });
  if (!careersConfig()) return json(503, UNAVAILABLE);

  const length = Number(request.headers.get('content-length') ?? 0);
  if (route.maxBytes && (!length || length > route.maxBytes)) {
    return json(length ? 413 : 411, {
      code: 'FILE_REJECTED',
      message: length ? 'Your files are too large. Keep the total under 25 MB.' : 'Content length is required.',
    });
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  const contentType = request.headers.get('content-type');
  if (route.maxBytes && contentType) headers['Content-Type'] = contentType;
  const token = request.headers.get('x-candidate-token');
  if (route.forwardToken && token) headers['X-Candidate-Token'] = token.slice(0, 2000);

  let upstream: Response;
  try {
    upstream = await careersFetch(`/${path}`, {
      method: request.method,
      headers,
      body: route.maxBytes ? request.body : null,
      ip: visitorIp(request.headers, clientAddress),
    });
  } catch {
    return json(503, UNAVAILABLE);
  }

  if (upstream.status === 401) {
    const body = (await upstream.json().catch(() => ({}))) as { code?: string };
    // OTP_INVALID is the visitor's; UNAUTHORIZED is ours.
    if (body.code !== 'OTP_INVALID') return json(503, UNAVAILABLE);
    return json(401, body as Record<string, unknown>);
  }

  const passthrough: Record<string, string> = {};
  const retry = upstream.headers.get('retry-after');
  if (retry) passthrough['Retry-After'] = retry;
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
      ...passthrough,
    },
  });
}
