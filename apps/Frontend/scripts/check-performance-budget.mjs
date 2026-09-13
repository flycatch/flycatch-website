#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(root, 'dist');
const clientDir = join(distRoot, 'client');
const distDir = existsSync(clientDir) ? clientDir : distRoot;
const publicDir = join(root, 'public');
let total = 0;
let jsBytes = 0;
const svgFiles = [];

function walk(dir, onFile) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, onFile);
    else onFile(full, entry, statSync(full).size);
  }
}

walk(distDir, (full, entry, size) => {
  total += size;
  if (entry.endsWith('.js')) jsBytes += size;
  if (entry.endsWith('.svg')) svgFiles.push({ full, size });
});
walk(publicDir, (full, entry, size) => {
  if (entry.endsWith('.svg')) svgFiles.push({ full, size });
});

const kiB = total / 1024;
const maxJsBytes = 40 * 1024;
const maxTransferKiB = 400;
/** Critical-path SVG budget. Production's logo SVG was 372 KB; none may exceed this. */
const maxSvgBytes = 8 * 1024;
const homeHtml = join(distDir, 'index.html');
if (existsSync(homeHtml)) {
  const homeCss = [readFileSync(homeHtml, 'utf8')];
  const hrefs = [...homeCss[0].matchAll(/href="([^"]+\.css)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    const cssPath = join(distDir, href.replace(/^\//, ''));
    if (existsSync(cssPath)) homeCss.push(readFileSync(cssPath, 'utf8'));
  }
  const bundled = homeCss.join('\n');
  if (bundled.includes('.page-main') || bundled.includes('Interior page styles')) {
    console.error('Home page loads interior/about page styles (.page-main)');
    process.exit(1);
  }
}
const oversizedSvg = svgFiles.filter((file) => file.size > maxSvgBytes);
if (oversizedSvg.length) {
  console.error(
    `SVG budget exceeded (limit ${maxSvgBytes / 1024} KiB):\n${oversizedSvg
      .map((file) => `  ${(file.size / 1024).toFixed(1)} KiB ${file.full}`)
      .join('\n')}`,
  );
  process.exit(1);
}
if (jsBytes > maxJsBytes) {
  console.error(
    `Client JS budget exceeded: ${(jsBytes / 1024).toFixed(1)} KiB (limit ${maxJsBytes / 1024} KiB)`,
  );
  process.exit(1);
}
if (kiB > maxTransferKiB) {
  console.error(`Transfer budget exceeded: ${kiB.toFixed(1)} KiB`);
  process.exit(1);
}
console.log(
  `Performance budget passed (${kiB.toFixed(1)} KiB transfer, ${(jsBytes / 1024).toFixed(1)} KiB JS / ${maxJsBytes / 1024} KiB, ${svgFiles.length} SVG ≤ ${maxSvgBytes / 1024} KiB)`,
);

const { spawnSync } = await import('node:child_process');
const vitals = spawnSync(process.execPath, [join(root, 'scripts/check-vitals-baseline.mjs')], {
  stdio: 'inherit',
});
if (vitals.status !== 0) process.exit(vitals.status ?? 1);
