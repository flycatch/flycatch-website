#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const baselinePath = join(
  repoRoot,
  'openspec/changes/migrate-flycatch-website/baseline/production-urls.json',
);
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const base = (process.env.BASE_URL || process.env.PUBLIC_ORIGIN || 'http://localhost:4321').replace(
  /\/$/,
  '',
);

async function request(url) {
  const response = await fetch(url, { redirect: 'manual' });
  return {
    status: response.status,
    location: response.headers.get('location'),
  };
}

function resolveLocation(fromUrl, location) {
  return new URL(location, fromUrl).href;
}

const failures = [];
let ok = 0;

for (const entry of baseline.urls) {
  const url = `${base}${entry.path === '/' ? '/' : entry.path}`;
  const first = await request(url);
  if (first.status === 200) {
    ok += 1;
    continue;
  }
  if (first.status === 301 && first.location) {
    const nextUrl = resolveLocation(url, first.location);
    const second = await request(nextUrl);
    if (second.status === 200) {
      ok += 1;
      continue;
    }
    failures.push(
      `${entry.path}: 301 → ${first.location} then ${second.status} (expected 200)`,
    );
    continue;
  }
  failures.push(`${entry.path}: ${first.status} (expected 200 or single-hop 301)`);
}

if (failures.length) {
  console.error(`Baseline URL check against ${base}: ${ok}/${baseline.urls.length} passed`);
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Baseline URL check against ${base}: ${ok}/${baseline.urls.length} returned 200 or a single-hop 301 to 200`);
