/** Visitor-facing production origin. Shared image builds bake the k3s dev host. */
export const PRODUCTION_PUBLIC_ORIGIN = 'https://www.flycatchtech.com';
export const DEV_CLUSTER_ORIGIN = 'https://flycatch-website-dev.k3s.flycatchtech.in';

const PRODUCTION_HOSTS = new Set(['www.flycatchtech.com', 'flycatchtech.com']);

export function requestHostname(url: URL, headers?: Headers): string {
  const forwarded = headers?.get('x-forwarded-host');
  if (forwarded) return forwarded.split(',')[0].trim().split(':')[0].toLowerCase();
  return url.hostname.toLowerCase();
}

export function isPublicProductionHost(hostname: string): boolean {
  return PRODUCTION_HOSTS.has(hostname.toLowerCase());
}

/** Prefer the live www host and runtime env over a Vite-baked k3s origin. */
export function resolvePublicOrigin(options: {
  hostname?: string;
  runtimeOrigin?: string | null;
  runtimeEnvironment?: string | null;
  fallbackOrigin: string;
}): string {
  if (options.hostname && isPublicProductionHost(options.hostname)) {
    return PRODUCTION_PUBLIC_ORIGIN;
  }
  const runtime = (options.runtimeOrigin || '').replace(/\/$/, '');
  if (options.runtimeEnvironment === 'production') {
    if (runtime && runtime !== DEV_CLUSTER_ORIGIN) return runtime;
    return PRODUCTION_PUBLIC_ORIGIN;
  }
  return (runtime || options.fallbackOrigin).replace(/\/$/, '');
}

/** Swap leftover prerendered k3s origins when the request is for the public site. */
export function rewriteDevOriginInHtml(html: string, hostname: string): string {
  if (!isPublicProductionHost(hostname) || !html.includes(DEV_CLUSTER_ORIGIN)) return html;
  return html.split(DEV_CLUSTER_ORIGIN).join(PRODUCTION_PUBLIC_ORIGIN);
}
