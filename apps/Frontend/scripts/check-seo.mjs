#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '../dist');
const pagesDir = join(distDir, '');

function walkHtml(dir) {
  const issues = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) issues.push(...walkHtml(full));
    else if (entry.name.endsWith('.html')) {
      const html = readFileSync(full, 'utf8');
      const titles = [...html.matchAll(/<title>([^<]+)<\/title>/g)].map((m) => m[1]);
      const h1s = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/g)].map((m) => m[1]);
      const canonicals = [...html.matchAll(/rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
      if (!titles.length || !titles[0]) issues.push(`${full}: missing title`);
      if (h1s.length !== 1) issues.push(`${full}: expected exactly one h1, found ${h1s.length}`);
      if (!canonicals.length) issues.push(`${full}: missing canonical`);
    }
  }
  return issues;
}

try {
  const issues = walkHtml(pagesDir);
  if (issues.length) {
    console.error(issues.join('\n'));
    process.exit(1);
  }
  console.log('SEO check passed');
} catch (err) {
  console.error('Run astro build before check:seo');
  process.exit(1);
}
