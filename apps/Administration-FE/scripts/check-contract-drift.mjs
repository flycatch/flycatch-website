#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = join(root, 'src/generated');
const required = [
  'admin-auth.v2.ts',
  'admin-rbac.v1.ts',
  'admin-management.v2.ts',
  'admin-roles.v1.ts',
  'publish.v2.ts',
];

let failed = false;
for (const file of required) {
  const full = join(generatedDir, file);
  if (!existsSync(full)) {
    console.error(`Missing generated contract file: ${file}. Run npm run generate:client`);
    failed = true;
  }
}

const api = readFileSync(join(root, 'src/lib/admin-api.ts'), 'utf8');
const forbidden = [
  /export (type|interface) TokenPair\s*\{/,
  /export (type|interface) SessionContext\s*\{/,
  /export (type|interface) PermissionName\s*=\s*['"]/,
  /export (type|interface) PermissionDenied\s*\{/,
];
for (const pattern of forbidden) {
  if (pattern.test(api)) {
    console.error(`Hand-written token/permission DTO detected in admin-api.ts: ${pattern}`);
    failed = true;
  }
}

if (!api.includes('../generated/admin-auth.v2') || !api.includes('../generated/admin-rbac.v1')) {
  console.error('admin-api.ts must import token/permission types from generated 002 contracts');
  failed = true;
}

if (failed) process.exit(1);
console.log('Administration FE contract drift check passed');
