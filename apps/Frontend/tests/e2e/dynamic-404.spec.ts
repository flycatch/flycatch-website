import { test, expect } from '@playwright/test';

test('unknown blog slug returns HTTP 404', async ({ request, baseURL }) => {
  const origin = baseURL?.replace(/\/$/, '') || '';
  const response = await request.get(`${origin}/company/blogs/no-such-blog-post`);
  expect(response.status()).toBe(404);
});

test('unknown case study slug returns HTTP 404', async ({ request, baseURL }) => {
  const origin = baseURL?.replace(/\/$/, '') || '';
  const response = await request.get(`${origin}/case-studies/no-such-case-study`);
  expect(response.status()).toBe(404);
});

test('unknown service slug returns HTTP 404', async ({ request, baseURL }) => {
  const origin = baseURL?.replace(/\/$/, '') || '';
  const response = await request.get(`${origin}/services/no-such-service`);
  expect(response.status()).toBe(404);
});

test('unknown solution slug returns HTTP 404', async ({ request, baseURL }) => {
  const origin = baseURL?.replace(/\/$/, '') || '';
  const response = await request.get(`${origin}/solutions/no-such-solution`);
  expect(response.status()).toBe(404);
});

test('production service and solution paths return 200', async ({ request, baseURL }) => {
  const origin = baseURL?.replace(/\/$/, '') || '';
  for (const path of [
    '/services',
    '/services/devOps-consultation',
    '/solutions',
    '/solutions/flyGrid-ai',
    '/company/careers',
    '/company/jobs-openings',
    '/company/resources',
    '/company/memberships',
    '/company/news-and-events',
    '/contact-us',
    '/software-development-services-in-saudi-arabia',
    '/privacy-policy',
    '/terms-and-conditions',
  ]) {
    const response = await request.get(`${origin}${path}`);
    expect(response.status(), path).toBe(200);
  }
});
