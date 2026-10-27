import { afterEach, describe, expect, it, vi } from 'vitest';
import { toPublicOpening, visitorIp, type CareersOpening } from '../../src/lib/careers-api';
import { matchRoute, proxyCareers } from '../../src/lib/careers-proxy';

const opening: CareersOpening = {
  id: '0b6f6a52-6f2e-4c53-9f5e-0a0e8f6b7a11',
  code: 'FLY-ENG-014',
  title: 'Site Engineer',
  department: 'Engineering',
  locations: [{ label: 'Riyadh', country: 'SA' }],
  workMode: 'On-site',
  employmentType: 'Full-Time',
  expMin: 3,
  expMax: 6,
  qualification: null,
  description: '<p>Build things</p>',
  mandatorySkills: [],
  optionalSkills: [],
  applyBy: '2026-12-31',
  acceptingApplications: true,
  datePosted: '2026-10-01T00:00:00.000Z',
  organisation: 'Flycatch',
  country: 'SA',
  otpRequired: false,
};

describe('toPublicOpening', () => {
  it('maps an HRMS opening onto the shape the listing and detail pages render', () => {
    const mapped = toPublicOpening(opening);
    expect(mapped).toMatchObject({
      slug: 'FLY-ENG-014',
      role: 'Site Engineer',
      experience: '3-6 Years',
      location: 'Riyadh',
      job_type: 'Full-Time',
      job_status: 'Open',
      specialization: 'Engineering',
      exp_date: '2026-12-31',
    });
    expect(mapped.careers).toBe(opening);
  });

  it('labels on-hold roles and falls back for a missing department and single-year experience', () => {
    const mapped = toPublicOpening({ ...opening, acceptingApplications: false, department: null, expMax: 3, locations: [] });
    expect(mapped.job_status).toBe('On hold');
    expect(mapped.specialization).toBe('Other');
    expect(mapped.experience).toBe('3 Years');
    expect(mapped.location).toBe('On-site');
  });
});

describe('visitorIp', () => {
  it('takes the first forwarded address', () => {
    expect(visitorIp(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.2' }))).toBe('203.0.113.9');
    expect(visitorIp(new Headers(), '198.51.100.1')).toBe('198.51.100.1');
  });
});

describe('matchRoute', () => {
  it('allows only the candidate-facing calls', () => {
    expect(matchRoute('POST', `openings/${opening.id}/applications`)).not.toBeNull();
    expect(matchRoute('POST', 'otp')).not.toBeNull();
    expect(matchRoute('GET', 'status')).not.toBeNull();
    expect(matchRoute('POST', 'applications/APP-1042/withdraw')).not.toBeNull();
    expect(matchRoute('GET', 'openings')).toBeNull();
    expect(matchRoute('GET', 'links/abc12')).toBeNull();
    expect(matchRoute('POST', 'openings/../otp')).toBeNull();
    expect(matchRoute('DELETE', 'status')).toBeNull();
  });
});

describe('proxyCareers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const configure = () => {
    vi.stubEnv('PEOPLE_API_ORIGIN', 'https://people.example');
    vi.stubEnv('PEOPLE_CAREERS_KEY', 'atsk_secret');
  };

  it('answers 404 for paths outside the allowlist', async () => {
    const response = await proxyCareers(new Request('http://site/careers-api/openings'), 'openings');
    expect(response.status).toBe(404);
  });

  it('answers 503 when the key is not configured', async () => {
    vi.stubEnv('PEOPLE_API_ORIGIN', '');
    vi.stubEnv('PEOPLE_CAREERS_KEY', '');
    const response = await proxyCareers(
      new Request('http://site/careers-api/otp', { method: 'POST', headers: { 'content-length': '2' }, body: '{}' }),
      'otp',
    );
    expect(response.status).toBe(503);
  });

  it('attaches the key and visitor IP, and never leaks the key to the browser', async () => {
    configure();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ sent: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const body = JSON.stringify({ email: 'a@b.co', purpose: 'apply' });
    const response = await proxyCareers(
      new Request('http://site/careers-api/otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': String(body.length), 'x-forwarded-for': '203.0.113.9' },
        body,
      }),
      'otp',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('https://people.example/api/public/careers/otp');
    expect(init.headers['X-Careers-Key']).toBe('atsk_secret');
    expect(init.headers['X-Forwarded-Client-Ip']).toBe('203.0.113.9');
    expect(JSON.stringify([...response.headers])).not.toContain('atsk_secret');
  });

  it('hides a rejected key as unavailable but passes OTP_INVALID through', async () => {
    configure();
    const reply = (code: string) => vi.fn(async () => new Response(JSON.stringify({ code, message: 'x' }), { status: 401, headers: { 'content-type': 'application/json' } }));
    const request = () =>
      new Request('http://site/careers-api/otp/verify', { method: 'POST', headers: { 'content-length': '2', 'content-type': 'application/json' }, body: '{}' });

    vi.stubGlobal('fetch', reply('UNAUTHORIZED'));
    const badKey = await proxyCareers(request(), 'otp/verify');
    expect(badKey.status).toBe(503);
    expect((await badKey.json()).code).toBe('UNAVAILABLE');

    vi.stubGlobal('fetch', reply('OTP_INVALID'));
    const badCode = await proxyCareers(request(), 'otp/verify');
    expect(badCode.status).toBe(401);
    expect((await badCode.json()).code).toBe('OTP_INVALID');
  });

  it('refuses an application over the size limit before contacting the HRMS', async () => {
    configure();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await proxyCareers(
      new Request(`http://site/careers-api/openings/${opening.id}/applications`, {
        method: 'POST',
        headers: { 'content-length': String(30 * 1024 * 1024), 'content-type': 'multipart/form-data; boundary=x' },
        body: 'x',
      }),
      `openings/${opening.id}/applications`,
    );
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
