#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contractsDir = join(root, 'specs/001-website-foundation/contracts');
const files = readdirSync(contractsDir).filter((f) => f.endsWith('.yaml'));

let failed = false;
for (const file of files) {
  try {
    execSync(`python3 -m openapi_spec_validator "${join(contractsDir, file)}"`, {
      stdio: 'inherit',
    });
    console.log(`✓ ${file}`);
  } catch {
    failed = true;
    console.error(`✗ ${file}`);
  }
}
process.exit(failed ? 1 : 0);
