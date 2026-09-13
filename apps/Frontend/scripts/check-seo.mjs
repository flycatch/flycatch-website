#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

function extractAttr(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1].trim());
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function inspectPage(full) {
  const html = readFileSync(full, 'utf8');
  const path = publicPathFromHtmlFile(full);
  const titles = extractAttr(html, /<title>([^<]*)<\/title>/gi);
  const descriptions = [
    ...extractAttr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/gi),
    ...extractAttr(html, /<meta[^>]+content="([^"]*)"[^>]+name="description"/gi),
  ];
  const canonicals = extractAttr(html, /rel="canonical" href="([^"]+)"/gi);
  const h1Matches = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];
  const jsonLdBlocks = [];
  const jsonLdIssues = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLdBlocks.push(JSON.parse(match[1]));
    } catch {
      jsonLdIssues.push(`${full}: invalid JSON-LD`);
    }
  }
  return { full, path, html, titles, descriptions, canonicals, h1Matches, jsonLdBlocks, jsonLdIssues };
}

function visibleHeadingLevels(html) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  return [...stripped.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)]
    .filter((match) => {
      const attrs = match[2];
      if (/\bhidden\b/i.test(attrs)) return false;
      if (/visually-hidden|sr-only/i.test(attrs)) return false;
      return Boolean(stripTags(match[3]));
    })
    .map((match) => Number(match[1]));
}

function jsonLdTypes(block) {
  const type = block?.['@type'];
  return Array.isArray(type) ? type : type ? [type] : [];
}

try {
  const pages = walkHtml(distDir).map(inspectPage);
  if (!pages.length) {
    console.error('Run astro build before check:seo');
    process.exit(1);
  }
  const issues = [];
  const indexableTitles = [];
  for (const page of pages) {
    issues.push(...page.jsonLdIssues);
    if (!page.titles.length || !page.titles[0]) issues.push(`${page.full}: missing title`);
    if (!page.descriptions.length || !page.descriptions[0]) {
      issues.push(`${page.full}: missing description`);
    }
    if (page.descriptions.some((text) => text.includes('This section will appear when published content is available.'))) {
      issues.push(`${page.full}: placeholder used as meta description`);
    }
    const headingLevels = visibleHeadingLevels(page.html);
    if (headingLevels[0] !== 1) {
      issues.push(`${page.full}: first visible heading is h${headingLevels[0] || 'missing'}`);
    }
    for (let index = 1; index < headingLevels.length; index += 1) {
      if (headingLevels[index] > headingLevels[index - 1] + 1) {
        issues.push(
          `${page.full}: heading level skips from h${headingLevels[index - 1]} to h${headingLevels[index]}`,
        );
      }
    }
    if (page.h1Matches.length !== 1) {
      issues.push(`${page.full}: expected exactly one h1, found ${page.h1Matches.length}`);
    } else {
      const attrs = page.h1Matches[0][1];
      const text = stripTags(page.h1Matches[0][2]);
      if (!text) issues.push(`${page.full}: empty h1`);
      if (/\bhidden\b|visually-hidden|sr-only/i.test(attrs)) {
        issues.push(`${page.full}: h1 is hidden or keyword-only`);
      }
    }
    if (!page.canonicals.length) issues.push(`${page.full}: missing canonical`);
    else {
      try {
        const canonicalPath = new URL(page.canonicals[0]).pathname.replace(/\/+$/, '') || '/';
        const expected = page.path.replace(/\/+$/, '') || '/';
        if (canonicalPath !== expected) {
          issues.push(`${page.full}: canonical ${page.canonicals[0]} is not self-referencing for ${expected}`);
        }
      } catch {
        issues.push(`${page.full}: canonical is not an absolute URL`);
      }
    }
    const types = new Set(page.jsonLdBlocks.flatMap(jsonLdTypes));
    if (!types.has('Organization')) issues.push(`${page.full}: missing Organization JSON-LD`);
    if (!types.has('WebSite')) issues.push(`${page.full}: missing WebSite JSON-LD`);
    for (const block of page.jsonLdBlocks) {
      if (!jsonLdTypes(block).length) issues.push(`${page.full}: JSON-LD block missing @type`);
      if (jsonLdTypes(block).includes('FAQPage')) {
        if (!Array.isArray(block.mainEntity) || block.mainEntity.length === 0) {
          issues.push(`${page.full}: FAQPage emitted with empty mainEntity`);
        }
      }
      if (jsonLdTypes(block).includes('Organization')) {
        if (!Array.isArray(block.sameAs) || block.sameAs.length === 0) {
          issues.push(`${page.full}: Organization sameAs is empty`);
        }
      }
    }
    const noindex = /noindex/i.test(page.html);
    if (!noindex && page.titles[0]) {
      indexableTitles.push({ title: page.titles[0], full: page.full });
    }
    const twitterTitle = extractAttr(page.html, /name="twitter:title" content="([^"]*)"/gi)[0] ?? '';
    const ogTitle = extractAttr(page.html, /property="og:title" content="([^"]*)"/gi)[0] ?? twitterTitle;
    const brandHits = (ogTitle.match(/Flycatch/gi) ?? []).length;
    if (brandHits > 1) issues.push(`${page.full}: social title repeats the brand name`);
    const hasImage =
      page.html.includes('property="og:image"') || page.html.includes('name="twitter:image"');
    if (page.html.includes('summary_large_image') && !hasImage) {
      issues.push(`${page.full}: summary_large_image without an image`);
    }
  }
  const seen = new Map();
  for (const entry of indexableTitles) {
    if (seen.has(entry.title)) {
      issues.push(`${entry.full}: duplicate title "${entry.title}" (also ${seen.get(entry.title)})`);
    } else {
      seen.set(entry.title, entry.full);
    }
  }
  if (issues.length) {
    console.error(issues.join('\n'));
    process.exit(1);
  }
  console.log(`SEO check passed (${pages.length} pages)`);
} catch (err) {
  console.error('Run astro build before check:seo');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
