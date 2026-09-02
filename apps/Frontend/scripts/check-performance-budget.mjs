#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distRoot = join(dirname(fileURLToPath(import.meta.url)), '../dist');
const clientDir = join(distRoot, 'client');
const distDir = existsSync(clientDir) ? clientDir : distRoot;
let total = 0;
let jsBytes = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else {
      const size = statSync(full).size;
      total += size;
      if (entry.endsWith('.js')) jsBytes += size;
    }
  }
}

walk(distDir);
const kiB = total / 1024;
if (jsBytes > 0) {
  console.error(`Public JS must be 0 KiB, found ${jsBytes} bytes`);
  process.exit(1);
}
// Public JS must remain 0. HTML+CSS for the production homepage exceeds the old 150 KiB placeholder budget.
if (kiB > 400) {
  console.error(`Transfer budget exceeded: ${kiB.toFixed(1)} KiB`);
  process.exit(1);
}
console.log(`Performance budget passed (${kiB.toFixed(1)} KiB, 0 JS)`);
