#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const outDir = join(here, '../src/generated');
const contractsDir =
  process.env.CONTRACTS_DIR || join(repoRoot, 'specs/002-auth-rbac/contracts');

const contracts = [
  'admin-auth.v2.yaml',
  'admin-rbac.v1.yaml',
  'admin-management.v2.yaml',
  'admin-roles.v1.yaml',
  'publish.v2.yaml',
];

mkdirSync(outDir, { recursive: true });

for (const file of contracts) {
  const src = join(contractsDir, file);
  const dest = join(outDir, file.replace(/\.yaml$/, '.ts'));
  execFileSync('npx', ['openapi-typescript', src, '-o', dest], {
    stdio: 'inherit',
    cwd: join(here, '..'),
  });
}

console.log('Generated Administration FE types from specs/002-auth-rbac/contracts/');
