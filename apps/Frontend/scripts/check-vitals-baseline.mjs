#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselineDir = join(
  frontendRoot,
  '../../openspec/changes/migrate-flycatch-website/baseline',
);
const productionPath = join(baselineDir, 'production-performance.json');
const candidatePath = join(baselineDir, 'candidate-performance.json');

const BUDGETS = {
  lcp_ms: 2500,
  inp_ms: 200,
  cls: 0.1,
  ttfb_ms: 600,
};

if (!existsSync(productionPath)) {
  console.error(`Missing 1.3 production baseline: ${productionPath}`);
  process.exit(1);
}
if (!existsSync(candidatePath)) {
  console.error(`Missing candidate vitals: ${candidatePath}`);
  process.exit(1);
}

const production = JSON.parse(readFileSync(productionPath, 'utf8'));
const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'));
const requiredIds = ['home', 'service', 'solution', 'case_study', 'blog'];
const errors = [];

function pageById(doc, id) {
  return (doc.pages || []).find((page) => page.id === id);
}

for (const id of requiredIds) {
  const prod = pageById(production, id);
  const next = pageById(candidate, id);
  if (!prod?.lab) errors.push(`${id}: missing from 1.3 production baseline`);
  if (!next?.lab) errors.push(`${id}: missing from candidate measurement`);
  if (!prod?.lab || !next?.lab) continue;

  for (const [metric, limit] of Object.entries(BUDGETS)) {
    const value = next.lab[metric];
    if (typeof value !== 'number') {
      errors.push(`${id}: ${metric} is not recorded`);
      continue;
    }
    if (value > limit) {
      errors.push(`${id}: ${metric}=${value} exceeds budget ${limit}`);
    }
  }

  if (typeof next.lab.lcp_ms === 'number' && typeof prod.lab.lcp_ms === 'number') {
    if (next.lab.lcp_ms >= prod.lab.lcp_ms) {
      errors.push(
        `${id}: LCP ${next.lab.lcp_ms}ms did not improve on production ${prod.lab.lcp_ms}ms`,
      );
    }
  }
  if (
    typeof next.lab.transfer_size_bytes === 'number' &&
    typeof prod.lab.transfer_size_bytes === 'number' &&
    next.lab.transfer_size_bytes >= prod.lab.transfer_size_bytes
  ) {
    errors.push(
      `${id}: transfer ${next.lab.transfer_size_bytes} did not improve on production ${prod.lab.transfer_size_bytes}`,
    );
  }
}

if (errors.length) {
  console.error(`Core Web Vitals check failed:\n${errors.map((line) => `  ${line}`).join('\n')}`);
  process.exit(1);
}

console.log(
  `Core Web Vitals passed against 1.3 baseline (${requiredIds.join(', ')}; LCP≤${BUDGETS.lcp_ms}ms INP≤${BUDGETS.inp_ms}ms CLS≤${BUDGETS.cls} TTFB≤${BUDGETS.ttfb_ms}ms)`,
);
