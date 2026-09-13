#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const isProduction = (process.env.PUBLIC_ENVIRONMENT || 'development') === 'production';
if (isProduction) {
  console.log('Indexability check skipped for production environment');
  process.exit(0);
}

const distDir = existsSync(join(dirname(fileURLToPath(import.meta.url)), '../dist/client'))
  ? join(dirname(fileURLToPath(import.meta.url)), '../dist/client')
  : join(dirname(fileURLToPath(import.meta.url)), '../dist');

function walkHtml(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const issues = [];
const files = walkHtml(distDir);
if (!files.length) {
  console.error('Run astro build before check:indexability');
  process.exit(1);
}
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  if (!/noindex/i.test(html)) {
    issues.push(`${file}: non-production page is missing noindex`);
  }
}

const robotsCandidates = [
  join(distDir, 'robots.txt'),
  join(dirname(fileURLToPath(import.meta.url)), '../src/lib/robots.ts'),
];
const robotsSource = robotsCandidates.find((path) => existsSync(path));
if (robotsSource) {
  const body = readFileSync(robotsSource, 'utf8');
  if (!body.includes('Disallow: /')) {
    issues.push(`${robotsSource}: non-production robots must disallow all crawling`);
  }
}

if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log(`Indexability check passed (${files.length} non-production pages are noindex)`);
