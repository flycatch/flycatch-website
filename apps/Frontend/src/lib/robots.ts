export function isProductionEnvironment(
  env: string | undefined = process.env.PUBLIC_ENVIRONMENT,
): boolean {
  return (env || 'development') === 'production';
}

export function absoluteSitemapUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}/sitemap.xml`;
}

export function buildRobotsTxt(isProduction: boolean, sitemapUrl: string): string {
  if (!isProduction) {
    return ['User-agent: *', 'Disallow: /', ''].join('\n');
  }
  return [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /admin',
    'Disallow: /api',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
}

export function htmlRobotsTag(env?: string): string | null {
  return isProductionEnvironment(env) ? null : 'noindex, nofollow';
}
