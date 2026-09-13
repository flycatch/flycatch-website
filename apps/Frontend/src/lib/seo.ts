export const SITE_BRAND = 'Flycatch';
export const DEFAULT_SOCIAL_IMAGE_PATH = '/opengraph-image.jpg';

const BRAND_SPLIT = /\s*(?:\||\u2014|—|--)\s*/;

export function socialTitleWithoutDuplicateBrand(
  title: string,
  brand: string = SITE_BRAND,
): string {
  const trimmed = title.trim();
  if (!trimmed) return brand;
  const parts = trimmed.split(BRAND_SPLIT).map((part) => part.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const part of parts) {
    const alreadyHasBrand = kept.some((item) => brandNameCount(item, brand) > 0);
    if (part.toLowerCase() === brand.toLowerCase() && alreadyHasBrand) continue;
    if (kept.some((item) => item.toLowerCase() === part.toLowerCase())) continue;
    kept.push(part);
  }
  let result = kept.join(' | ');
  const trailingBrand = new RegExp(
    `(?:\\s*(?:\\||\\u2014|—|--|-)\\s*)?${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
    'i',
  );
  while (brandNameCount(result, brand) > 1) {
    const next = result.replace(trailingBrand, '').trim();
    if (next === result) break;
    result = next;
  }
  return result;
}

export function brandNameCount(text: string, brand: string = SITE_BRAND): number {
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (text.match(new RegExp(escaped, 'gi')) ?? []).length;
}

export function defaultSocialImageUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}${DEFAULT_SOCIAL_IMAGE_PATH}`;
}

export function resolveSocialImageUrl(
  origin: string,
  imageUrl: string | null | undefined,
): string {
  const value = imageUrl?.trim();
  return value || defaultSocialImageUrl(origin);
}

export function publicPathFromHtmlFile(fullPath: string, distRoot: string): string {
  let relative = fullPath.slice(distRoot.length).replaceAll('\\', '/');
  if (relative.startsWith('/client/')) relative = relative.slice('/client'.length);
  if (!relative.startsWith('/')) relative = `/${relative}`;
  if (relative.endsWith('/index.html')) {
    const trimmed = relative.slice(0, -'/index.html'.length);
    return trimmed || '/';
  }
  if (relative.endsWith('.html')) {
    return relative.slice(0, -'.html'.length) || '/';
  }
  return relative;
}
