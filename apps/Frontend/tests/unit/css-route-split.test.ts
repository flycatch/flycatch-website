import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const frontendRoot = resolve(import.meta.dirname, '../..');

function source(rel: string) {
  return readFileSync(resolve(frontendRoot, rel), 'utf8');
}

describe('CSS route splitting', () => {
  it('keeps interior page styles out of the shared layout and home page', () => {
    expect(source('src/styles/layout.css')).not.toContain('.page-main');
    expect(source('src/pages/index.astro')).not.toContain('pages.css');
    expect(source('src/pages/index.astro')).not.toContain('InteriorLayout');
    expect(source('src/layouts/BaseLayout.astro')).not.toContain('pages.css');
    expect(source('src/styles/pages.css')).toContain('.page-main');
    expect(source('src/layouts/InteriorLayout.astro')).toContain("import '../styles/pages.css'");
    expect(source('src/pages/company/about-us.astro')).toContain('InteriorLayout');
  });
});
