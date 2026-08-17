#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contractDirs = [
  join(root, 'specs/001-website-foundation/contracts'),
  join(root, 'specs/002-auth-rbac/contracts'),
];

let failed = false;
for (const contractsDir of contractDirs) {
  const files = readdirSync(contractsDir).filter(
    (f) => f.endsWith('.yaml') && f !== 'bootstrap.cli.yaml',
  );
  for (const file of files) {
    const full = join(contractsDir, file);
    try {
      execSync(`python3 -m openapi_spec_validator "${full}"`, {
        stdio: 'inherit',
      });
      console.log(`✓ ${file}`);
    } catch {
      failed = true;
      console.error(`✗ ${file}`);
    }
  }
}
process.exit(failed ? 1 : 0);
