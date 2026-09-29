#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const candidates = [
  join(root, 'dist', 'client', 'sitemap.xml'),
  join(root, 'dist', 'sitemap.xml'),
  join(root, 'src', 'pages', 'sitemap.xml.ts'),
];

const source = candidates.find((path) => existsSync(path));
if (!source) {
  console.error('Missing sitemap — expected sitemap.xml.ts or a built sitemap.xml');
  process.exit(1);
}

if (source.endsWith('.ts')) {
  const text = readFileSync(source, 'utf8');
  if (!text.includes('buildSitemapXml') || !text.includes('staticSitemapPaths')) {
    console.error('sitemap.xml.ts is missing required sitemap helpers');
    process.exit(1);
  }
  if (text.includes('/about') && text.includes("paths.push('/about')")) {
    console.error('Sitemap must not include /about');
    process.exit(1);
  }
  console.log('Sitemap route check passed');
  process.exit(0);
}

const xml = readFileSync(source, 'utf8');
if (xml.includes('/admin') || xml.includes('/api')) {
  console.error('Sitemap must not include admin or api URLs');
  process.exit(1);
}
if (xml.includes('/about') || xml.includes('/solutions/combus')) {
  console.error('Sitemap must not include redirect-only duplicates');
  process.exit(1);
}
const locs = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) => m[1].trim());
const paths = locs.map((loc) => {
  try {
    return new URL(loc).pathname.replace(/\/$/, '') || '/';
  } catch {
    return loc;
  }
});
const seen = new Set();
for (const path of paths) {
  if (seen.has(path)) {
    console.error(`Sitemap has duplicate path: ${path}`);
    process.exit(1);
  }
  seen.add(path);
}
console.log('Sitemap check passed');
