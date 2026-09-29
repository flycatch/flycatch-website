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
  if (path === '/services/data-management') return '/services/data-migration';
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
