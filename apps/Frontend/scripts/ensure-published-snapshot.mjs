import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../src/data');
const dest = join(dataDir, 'published.json');
const seed = join(dataDir, 'published.seed.json');

if (existsSync(dest)) {
  process.exit(0);
}

if (!existsSync(seed)) {
  console.error('Missing src/data/published.seed.json');
  process.exit(1);
}

mkdirSync(dataDir, { recursive: true });
copyFileSync(seed, dest);
console.log('Wrote src/data/published.json from published.seed.json');
