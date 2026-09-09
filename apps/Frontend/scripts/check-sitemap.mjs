#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distRoot = join(dirname(fileURLToPath(import.meta.url)), '../dist');
const sitemapPath = existsSync(join(distRoot, 'client', 'sitemap-0.xml'))
  ? join(distRoot, 'client', 'sitemap-0.xml')
  : join(distRoot, 'sitemap-0.xml');
if (!existsSync(sitemapPath)) {
  console.error('Missing sitemap — run astro build first');
  process.exit(1);
}
const xml = readFileSync(sitemapPath, 'utf8');
if (xml.includes('/admin') || xml.includes('/api')) {
  console.error('Sitemap must not include admin or api URLs');
  process.exit(1);
}
console.log('Sitemap check passed');
