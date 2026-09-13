import type { APIRoute } from 'astro';
import { postPublicJson, safeReturnTo, wantsJson } from '../../../lib/form-proxy';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const downloadId = String(form.get('download_id') || '');
  const payload = {
    name: String(form.get('name') || ''),
    email: String(form.get('email') || ''),
    company: String(form.get('company') || ''),
    website: String(form.get('website') || ''),
    recaptcha_token: String(form.get('recaptcha_token') || ''),
  };
  const result = await postPublicJson(`/api/v1/public/downloads/${encodeURIComponent(downloadId)}/requests`, payload);
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok: result.ok, fields: result.fields, body: result.body }), {
      status: result.ok ? 201 : result.status || 422,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  const next = new URL(safeReturnTo(String(form.get('return_to') || '/company/resources'), '/company/resources'), request.url);
  next.searchParams.set(result.ok ? 'submitted' : 'form_error', 'download');
  if (result.ok && typeof result.body.file_key === 'string') {
    next.searchParams.set('file', String(result.body.file_key));
  }
  return Response.redirect(next, 303);
};
