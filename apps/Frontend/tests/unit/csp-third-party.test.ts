import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const caddy = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../../deployment/k8s/base/Caddyfile'),
  'utf8',
);

describe('enforcing CSP', () => {
  it('does not allow dropped Hotjar or Drift hosts', () => {
    expect(caddy).not.toMatch(/hotjar/i);
    expect(caddy).not.toMatch(/driftt?\.com/i);
  });

  it('allows the retained reCAPTCHA and GTM hosts on the public site', () => {
    expect(caddy).toContain('https://www.google.com');
    expect(caddy).toContain('https://www.gstatic.com');
    expect(caddy).toContain('https://www.googletagmanager.com');
  });
});
