import type { APIRoute } from 'astro';
import { postPublicJson, safeReturnTo, wantsJson } from '../../../lib/form-proxy';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const payload = {
    email: String(form.get('email') || ''),
    website: String(form.get('website') || ''),
    recaptcha_token: String(form.get('recaptcha_token') || ''),
  };
  const result = await postPublicJson('/api/v1/public/newsletter/signup', payload);
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok: result.ok, fields: result.fields, body: result.body }), {
      status: result.ok ? 201 : result.status || 422,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  const next = new URL(safeReturnTo(String(form.get('return_to') || '/'), '/'), request.url);
  next.searchParams.set(result.ok ? 'submitted' : 'form_error', 'newsletter');
  return Response.redirect(next, 303);
};
