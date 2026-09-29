/** Pure SEO redirect map for public Frontend routes. */
export function redirectTarget(pathname: string): string | null {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return null;

  if (pathname === '/en' || pathname === '/en/') return '/';
  if (pathname.startsWith('/en/')) {
    const stripped = pathname.slice(3) || '/';
    return stripped.length > 1 && stripped.endsWith('/') ? stripped.slice(0, -1) : stripped;
  }

  if (pathname === '/about' || pathname === '/about/') return '/company/about-us';
  if (pathname === '/company/membership' || pathname === '/company/membership/') {
    return '/company/memberships';
  }

  const blogsMatch = pathname.match(/^\/blogs\/([^/]+)\/?$/);
  if (blogsMatch) return `/company/blogs/${blogsMatch[1]}`;

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return null;
}
