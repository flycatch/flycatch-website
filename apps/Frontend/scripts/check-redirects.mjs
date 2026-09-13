#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const mapping = JSON.parse(
  readFileSync(
    join(repoRoot, 'openspec/changes/migrate-flycatch-website/baseline/url-mapping.json'),
    'utf8',
  ),
);

const rules = [...mapping.case_variants, ...mapping.inherited_redirects, ...mapping.non_sitemap_200].filter(
  (rule) => rule.status === 301 && !String(rule.from).includes(':'),
);

const byFrom = new Map(rules.map((rule) => [rule.from, rule.to]));
const issues = [];

function hops(from) {
  const seen = [];
  let current = from;
  while (byFrom.has(current)) {
    const next = byFrom.get(current);
    if (seen.includes(next) || next === current) {
      issues.push(`${from}: looping redirect`);
      return seen;
    }
    seen.push(next);
    current = next;
  }
  return seen;
}

for (const rule of rules) {
  const chain = hops(rule.from);
  if (chain.length !== 1) {
    issues.push(`${rule.from}: expected a single hop, got ${chain.join(' -> ') || 'none'}`);
  }
}

if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log(`Redirect map check passed (${rules.length} single-hop rules)`);
