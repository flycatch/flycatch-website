#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const outDir = join(here, '../src/generated');
const authContractsDir =
  process.env.CONTRACTS_DIR || join(repoRoot, 'specs/002-auth-rbac/contracts');
const blogsContractsDir = join(repoRoot, 'specs/004-admin-blogs/contracts');
const caseStudiesContractsDir = join(repoRoot, 'specs/005-admin-case-studies/contracts');
const clientLogosContractsDir = join(repoRoot, 'specs/006-admin-client-logos/contracts');
const clientTestimonialsContractsDir = join(
  repoRoot,
  'specs/007-admin-client-testimonials/contracts',
);

const contractSets = [
  {
    dir: authContractsDir,
    files: [
      'admin-auth.v2.yaml',
      'admin-rbac.v1.yaml',
      'admin-management.v2.yaml',
      'admin-roles.v1.yaml',
      'publish.v2.yaml',
    ],
  },
  {
    dir: blogsContractsDir,
    files: ['admin-blogs.v1.yaml'],
  },
  {
    dir: caseStudiesContractsDir,
    files: ['admin-case-studies.v1.yaml'],
  },
  {
    dir: clientLogosContractsDir,
    files: ['admin-client-logos.v1.yaml'],
  },
  {
    dir: clientTestimonialsContractsDir,
    files: ['admin-client-testimonials.v1.yaml'],
  },
];

mkdirSync(outDir, { recursive: true });

for (const set of contractSets) {
  for (const file of set.files) {
    const src = join(set.dir, file);
    const dest = join(outDir, file.replace(/\.yaml$/, '.ts'));
    execFileSync('npx', ['openapi-typescript', src, '-o', dest], {
      stdio: 'inherit',
      cwd: join(here, '..'),
    });
  }
}

console.log('Generated Administration FE types from OpenAPI contracts');
