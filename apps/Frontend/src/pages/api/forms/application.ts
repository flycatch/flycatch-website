import type { APIRoute } from 'astro';
import { postPublicMultipart, safeReturnTo, wantsJson } from '../../../lib/form-proxy';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const result = await postPublicMultipart('/api/v1/public/applications', form);
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok: result.ok, fields: result.fields, body: result.body }), {
      status: result.ok ? 201 : result.status || 422,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  const next = new URL(
    safeReturnTo(String(form.get('return_to') || '/company/jobs-openings'), '/company/jobs-openings'),
    request.url,
  );
  next.searchParams.set(result.ok ? 'submitted' : 'form_error', 'application');
  return Response.redirect(next, 303);
};
