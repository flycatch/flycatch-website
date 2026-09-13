import { test, expect } from '@playwright/test';

const SKIP_PREFIXES = ['/api/', '/_astro/', '/_image'];

function toInternalPath(href: string, origin: string): string | null {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  if (SKIP_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return null;
  return `${url.pathname}${url.search}`;
}

test('internal link crawl from home returns no 404', async ({ request, baseURL }) => {
  const origin = (baseURL ?? 'http://localhost:4321').replace(/\/$/, '');
  const queue = ['/'];
  const seen = new Set<string>();
  const failures: string[] = [];

  while (queue.length) {
    const path = queue.shift();
    if (!path || seen.has(path)) continue;
    seen.add(path);

    const response = await request.get(`${origin}${path}`, { maxRedirects: 0 });
    const status = response.status();
    if (status >= 300 && status < 400) {
      const location = response.headers().location;
      if (!location) {
        failures.push(`${path} → ${status} without Location`);
        continue;
      }
      const next = toInternalPath(location, origin);
      if (next && !seen.has(next)) queue.push(next);
      continue;
    }
    if (status >= 400) {
      failures.push(`${path} → ${status}`);
      continue;
    }

    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.includes('text/html')) continue;

    const html = await response.text();
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const next = toInternalPath(match[1], origin);
      if (next && !seen.has(next) && !queue.includes(next)) queue.push(next);
    }
  }

  expect(seen.size, 'crawl visited at least the home page').toBeGreaterThan(0);
  expect(failures, failures.join('\n')).toEqual([]);
});
