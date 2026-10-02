import { describe, expect, it } from 'vitest';
import {
  DEV_CLUSTER_ORIGIN,
  PRODUCTION_PUBLIC_ORIGIN,
  requestHostname,
  resolvePublicOrigin,
  rewriteDevOriginInHtml,
} from '../../src/lib/public-origin';

describe('resolvePublicOrigin', () => {
  it('uses www when the request host is the public site', () => {
    expect(
      resolvePublicOrigin({
        hostname: 'www.flycatchtech.com',
        runtimeOrigin: DEV_CLUSTER_ORIGIN,
        runtimeEnvironment: 'development',
        fallbackOrigin: DEV_CLUSTER_ORIGIN,
      }),
    ).toBe(PRODUCTION_PUBLIC_ORIGIN);
  });

  it('ignores the baked k3s origin in production', () => {
    expect(
      resolvePublicOrigin({
        runtimeOrigin: DEV_CLUSTER_ORIGIN,
        runtimeEnvironment: 'production',
        fallbackOrigin: DEV_CLUSTER_ORIGIN,
      }),
    ).toBe(PRODUCTION_PUBLIC_ORIGIN);
  });

  it('keeps the runtime origin on non-production hosts', () => {
    expect(
      resolvePublicOrigin({
        hostname: 'flycatch-website-dev.k3s.flycatchtech.in',
        runtimeOrigin: DEV_CLUSTER_ORIGIN,
        runtimeEnvironment: 'development',
        fallbackOrigin: 'http://localhost:8080',
      }),
    ).toBe(DEV_CLUSTER_ORIGIN);
  });
});

describe('rewriteDevOriginInHtml', () => {
  it('rewrites leftover k3s URLs on the public host', () => {
    const html = `<link rel="canonical" href="${DEV_CLUSTER_ORIGIN}/privacy-policy">`;
    expect(rewriteDevOriginInHtml(html, 'www.flycatchtech.com')).toBe(
      `<link rel="canonical" href="${PRODUCTION_PUBLIC_ORIGIN}/privacy-policy">`,
    );
  });

  it('leaves the k3s origin on the dev host', () => {
    const html = `<link rel="canonical" href="${DEV_CLUSTER_ORIGIN}/privacy-policy">`;
    expect(rewriteDevOriginInHtml(html, 'flycatch-website-dev.k3s.flycatchtech.in')).toBe(html);
  });
});

describe('requestHostname', () => {
  it('prefers X-Forwarded-Host', () => {
    const headers = new Headers({ 'x-forwarded-host': 'www.flycatchtech.com' });
    expect(requestHostname(new URL('http://frontend:4321/privacy-policy'), headers)).toBe(
      'www.flycatchtech.com',
    );
  });
});
