import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pagesDir = join(dirname(fileURLToPath(import.meta.url)), '../../src/pages');

describe('legal pages stay server-rendered', () => {
  it.each(['privacy-policy.astro', 'terms-and-conditions.astro'])(
    '%s does not set prerender = true',
    (filename) => {
      const source = readFileSync(join(pagesDir, filename), 'utf8');
      expect(source).not.toMatch(/export\s+const\s+prerender\s*=\s*true/);
    },
  );
});
