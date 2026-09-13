#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(frontendRoot, '../..');
const distDir = existsSync(join(frontendRoot, 'dist/client'))
  ? join(frontendRoot, 'dist/client')
  : join(frontendRoot, 'dist');

const baseline = JSON.parse(
  readFileSync(
    join(repoRoot, 'openspec/changes/migrate-flycatch-website/baseline/production-urls.json'),
    'utf8',
  ),
);

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

function publicPathFromHtmlFile(fullPath) {
  let relative = fullPath.slice(distDir.length).replaceAll('\\', '/');
  if (!relative.startsWith('/')) relative = `/${relative}`;
  if (relative.endsWith('/index.html')) {
    return relative.slice(0, -'/index.html'.length) || '/';
  }
  if (relative.endsWith('.html')) {
    return relative.slice(0, -'.html'.length) || '/';
  }
  return relative;
}

function sitemapLocs() {
  const candidates = [join(distDir, 'sitemap.xml'), join(frontendRoot, 'dist/client/sitemap.xml')];
  const sitemapPath = candidates.find((path) => existsSync(path));
  if (!sitemapPath) return [];
  const xml = readFileSync(sitemapPath, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    try {
      const pathname = new URL(match[1]).pathname.replace(/\/+$/, '') || '/';
      return pathname;
    } catch {
      return match[1];
    }
  });
}

const pages = walkHtml(distDir).map(publicPathFromHtmlFile);
const built = new Set(pages.filter((path) => path !== '/404'));

if (!built.size) {
  console.error('Run astro build before check:prerender');
  process.exit(1);
}

const missingSitemap = sitemapLocs().filter((path) => !built.has(path));
const baselinePaths = baseline.urls.map((entry) => (entry.path === '' ? '/' : entry.path));
const missingBaseline = baselinePaths.filter((path) => !built.has(path));

const issues = [];
if (missingSitemap.length) {
  issues.push(
    `Sitemap paths missing HTML:\n${missingSitemap.map((path) => `  ${path}`).join('\n')}`,
  );
}
if (missingBaseline.length) {
  issues.push(
    `Baseline URLs missing HTML (${missingBaseline.length}/${baselinePaths.length}):\n${missingBaseline
      .map((path) => `  ${path}`)
      .join('\n')}`,
  );
}

if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}

console.log(
  `Prerender check passed (${built.size} HTML pages; ${baselinePaths.length}/${baselinePaths.length} baseline URLs)`,
);
