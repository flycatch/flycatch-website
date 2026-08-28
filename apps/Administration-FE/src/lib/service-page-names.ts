export const SERVICE_PAGE_NAMES = [
  'cloud-services',
  'cloud-consultation',
  'cloud-migration',
  'hybrid-cloud',
  'cloud-security',
  'cloud-optimization',
] as const;

export const DATA_PAGE_NAMES = [
  'data-management',
  'data-management-strategy',
  'data-engineering',
  'visualization-and-intelligence',
  'data-migration',
  'big-data-analytics',
] as const;

export type ServicePageName = (typeof SERVICE_PAGE_NAMES)[number];
export type DataPageName = (typeof DATA_PAGE_NAMES)[number];
export type NamedPageName = ServicePageName | DataPageName;
