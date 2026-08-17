#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const forbidden = [
  'SESSION_SECRET',
  'CSRF_SECRET',
  'JWT_SECRET',
  'BUILD_EXPORT_TOKEN',
  'S3_SECRET_KEY',
  '$argon2',
  'eyJhbGci',
];
const dirs = ['apps/Frontend/dist', 'apps/Administration-FE/dist'];

let failed = false;
for (const dir of dirs) {
  try {
    walk(join(root, dir));
  } catch {
    // dist may not exist yet
  }
}

function walk(path) {
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(js|html|css|json)$/.test(entry)) {
      const content = readFileSync(full, 'utf8');
      for (const secret of forbidden) {
        if (content.includes(secret)) {
          console.error(`Secret marker found in ${full}: ${secret}`);
          failed = true;
        }
      }
    }
  }
}

if (failed) process.exit(1);
console.log('Secret scan passed');
