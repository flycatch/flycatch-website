#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distRoot = join(dirname(fileURLToPath(import.meta.url)), '../dist');
const candidates = [
  join(distRoot, 'client', 'sitemap.xml'),
  join(distRoot, 'sitemap.xml'),
];
const sitemapPath = candidates.find((path) => existsSync(path));
if (!sitemapPath) {
  console.error('Missing sitemap.xml — run astro build first');
  process.exit(1);
}
const xml = readFileSync(sitemapPath, 'utf8');
if (xml.includes('/admin') || xml.includes('/api/')) {
  console.error('Sitemap must not include admin or api URLs');
  process.exit(1);
}
if (xml.includes('sitemap-index') || xml.includes('sitemap-0.xml')) {
  console.error('Sitemap must be a single /sitemap.xml document, not an index');
  process.exit(1);
}
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!locs.length) {
  console.error('Sitemap contains no loc entries');
  process.exit(1);
}
const normalized = locs.map((loc) => loc.replace(/\/$/, '') || loc);
if (new Set(locs).size !== locs.length || new Set(normalized).size !== normalized.length) {
  console.error('Sitemap contains duplicate loc values');
  process.exit(1);
}
console.log(`Sitemap check passed (${locs.length} URLs at /sitemap.xml)`);
