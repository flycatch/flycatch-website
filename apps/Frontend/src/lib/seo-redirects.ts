import {
  resolveSolutionDetailRoute,
  solutionDetailPath,
} from './solution-detail';

const LONG_CLOUD_MIGRATION_BLOG =
  '/company/blogs/explore-practical-cloud-migration-strategies-that-enhance-scalability-security-and-performance-learn-how-to-plan-execute-and-optimize-your-move-to-the-cloud';

const SHORT_CLOUD_MIGRATION_BLOG =
  '/company/blogs/explore-practical-cloud-migration-strategies-that-enhance-scalability-security-and-performance-learn-how-to-plan-execute-and-opt';

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en' || pathname === '/en/') return '/';
  if (pathname.startsWith('/en/')) {
    const stripped = pathname.slice(3) || '/';
    return stripTrailingSlash(stripped);
  }
  return pathname;
}

/** Map a locale-stripped path to its canonical public URL, or null if unchanged. */
function mapLegacyPath(pathname: string): string | null {
  const path = stripTrailingSlash(pathname);

  if (path === '/about' || path === '/about-us') return '/company/about-us';
  if (path === '/company/membership') return '/company/memberships';
  if (
    path === '/services/data-management' ||
    path === '/services/data-management-strategy' ||
    path === '/services/data-engineering' ||
    path === '/services/big-data-analytics' ||
    path === '/services/visualization-and-intelligence'
  ) {
    return '/services/data-migration';
  }
  if (path === '/services/ai-services/agentic-ai') return '/services/ai-services';
  if (path === '/application-development') return '/services/application-development-services';
  if (path === '/solutions/combus') return '/solutions/com-bus';
  if (path === LONG_CLOUD_MIGRATION_BLOG) return SHORT_CLOUD_MIGRATION_BLOG;

  const blogsMatch = path.match(/^\/blogs\/([^/]+)$/);
  if (blogsMatch) return `/company/blogs/${blogsMatch[1]}`;

  const solutionsMatch = path.match(/^\/solutions\/([^/]+)$/);
  if (solutionsMatch) {
    const product = resolveSolutionDetailRoute(solutionsMatch[1]);
    if (product) {
      const canonical = solutionDetailPath(product);
      if (canonical !== path) return canonical;
    }
  }

  if (path !== pathname) return path;
  return null;
}

/** Pure SEO redirect map for public Frontend routes. One hop to the final path. */
export function redirectTarget(pathname: string): string | null {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return null;

  const withoutLocale = stripLocalePrefix(pathname);
  const mapped = mapLegacyPath(withoutLocale);
  const target = mapped ?? (withoutLocale !== pathname ? withoutLocale : null);
  if (target === null || target === pathname) return null;
  return target;
}

const SITE_HOSTS = new Set(['www.flycatchtech.com', 'flycatchtech.com']);

/** Map a stored public href to the live path. Leave mailto, hashes, and off-site URLs. */
export function rewritePublicHref(href: string): string {
  const raw = href.trim();
  if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
    return href;
  }

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    const url = new URL(raw, 'https://www.flycatchtech.com');
    const target = redirectTarget(url.pathname);
    if (!target) return href;
    return `${target}${url.search}${url.hash}`;
  }

  if (!raw.startsWith('http://') && !raw.startsWith('https://')) return href;

  try {
    const url = new URL(raw);
    if (!SITE_HOSTS.has(url.hostname.toLowerCase())) return href;
    const target = redirectTarget(url.pathname);
    if (!target) return href;
    url.pathname = target;
    return url.toString();
  } catch {
    return href;
  }
}

/** Rewrite href attributes in CMS HTML through the public redirect map. */
export function rewritePublicHrefs(html: string): string {
  return html.replace(/href=(["'])([^"']*)\1/gi, (match, quote: string, value: string) => {
    const next = rewritePublicHref(value);
    return next === value ? match : `href=${quote}${next}${quote}`;
  });
}
