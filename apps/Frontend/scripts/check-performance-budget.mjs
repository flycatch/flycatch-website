#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '../dist');
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
if (kiB > 150) {
  console.error(`Transfer budget exceeded: ${kiB.toFixed(1)} KiB`);
  process.exit(1);
}
console.log(`Performance budget passed (${kiB.toFixed(1)} KiB, 0 JS)`);
