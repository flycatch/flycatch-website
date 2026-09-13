import type { APIRoute } from 'astro';
import { postPublicJson, safeReturnTo, wantsJson } from '../../../lib/form-proxy';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const payload = {
    name: String(form.get('name') || ''),
    last_name: String(form.get('last_name') || ''),
    email: String(form.get('email') || ''),
    phone: String(form.get('phone') || ''),
    country: String(form.get('country') || ''),
    subject: String(form.get('subject') || ''),
    details: String(form.get('details') || ''),
    contact_type: String(form.get('contact_type') || ''),
    company_name: String(form.get('company_name') || ''),
    website: String(form.get('website') || ''),
    recaptcha_token: String(form.get('recaptcha_token') || ''),
  };
  const result = await postPublicJson('/api/v1/public/contacts', payload);
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok: result.ok, fields: result.fields, body: result.body }), {
      status: result.ok ? 201 : result.status || 422,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  const next = new URL(safeReturnTo(String(form.get('return_to') || '/contact-us'), '/contact-us'), request.url);
  next.searchParams.set(result.ok ? 'submitted' : 'form_error', result.ok ? 'contact' : 'contact');
  return Response.redirect(next, 303);
};
