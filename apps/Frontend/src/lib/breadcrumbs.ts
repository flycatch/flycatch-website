import { t } from './i18n';
import { buildCanonicalUrl } from './metadata';
import { resolveRoute } from './route-registry';

export type BreadcrumbTrailItem = {
  path: string;
  label: string;
};

export function breadcrumbTrail(
  path: string,
  currentLabel?: string,
): BreadcrumbTrailItem[] {
  const route = resolveRoute(path);
  if (!route || route.path === '/') return [];
  const ancestors = route.ancestors.map((item) => ({
    path: item.path,
    label: t(item.labelKey),
  }));
  return [
    ...ancestors,
    {
      path: route.path,
      label: currentLabel?.trim() || t(route.labelKey),
    },
  ];
}

export function breadcrumbAbsoluteItems(
  path: string,
  origin: string,
  currentLabel?: string,
): { name: string; url: string }[] {
  return breadcrumbTrail(path, currentLabel).map((item) => ({
    name: item.label,
    url: buildCanonicalUrl(origin, item.path),
  }));
}
