import type { PublicOpening } from './public-api';

/** The listing's filters, in the order they appear in the URL. Values are normalised with filterKey. */
export const FILTER_KEYS = ['q', 'country', 'location', 'dept', 'mode', 'type'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type JobFilters = Record<FilterKey, string>;

/** What a card exposes to the filters; also written onto the card as data attributes. */
export type JobFacets = {
  search: string;
  countries: string[];
  places: string[];
  dept: string;
  mode: string;
  type: string;
};

export type JobCard = {
  slug: string;
  role: string;
  dept: string;
  places: string[];
  countries: string[];
  mode: string;
  type: string;
  experience: string;
  skills: string[];
  applyBy: string | null;
  isNew: boolean;
  paused: boolean;
  postedAt: number;
  facets: JobFacets;
};

export type FacetOption = { value: string; label: string; count: number; country?: string };

const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

/** The HRMS is not consistent about case ("Full-Time" vs "Full-time"), so filters compare on this. */
export function filterKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

export function toJobCard(job: PublicOpening, now = Date.now()): JobCard {
  const source = job.careers;
  const dept = source?.department?.trim() || '';
  const places = unique(source?.locations.map((l) => l.label.trim()) ?? []);
  const countries = unique([
    ...(source?.locations.map((l) => (l.country ?? '').toUpperCase()) ?? []),
    (source?.country ?? '').toUpperCase(),
  ]);
  const mode = source?.workMode?.trim() || '';
  const type = (source?.employmentType ?? job.job_type ?? '').trim();
  const skills = source?.mandatorySkills ?? [];
  const posted = source?.datePosted ? Date.parse(source.datePosted) : NaN;
  return {
    slug: job.slug,
    role: job.role,
    dept,
    places: places.length ? places : job.location ? [job.location] : [],
    countries,
    mode,
    type,
    experience: job.experience.trim(),
    skills: skills.slice(0, 3),
    applyBy: source?.applyBy ?? job.exp_date ?? null,
    isNew: Number.isFinite(posted) && now - posted >= 0 && now - posted < NEW_FOR_MS,
    paused: source ? !source.acceptingApplications : job.job_status !== 'Open',
    postedAt: Number.isFinite(posted) ? posted : 0,
    facets: {
      search: filterKey([job.role, dept, ...skills, ...(source?.optionalSkills ?? []), ...places].join(' ')),
      countries: countries.map(filterKey),
      places: places.map(filterKey),
      dept: filterKey(dept),
      mode: filterKey(mode),
      type: filterKey(type),
    },
  };
}

/** Open roles first, newest first within each. */
export function sortCards(cards: JobCard[]): JobCard[] {
  return [...cards].sort((a, b) => Number(a.paused) - Number(b.paused) || b.postedAt - a.postedAt);
}

/** Distinct values with counts, labelled from the first spelling seen. */
export function facetOptions(cards: JobCard[], pick: (card: JobCard) => string[]): FacetOption[] {
  const options = new Map<string, FacetOption>();
  for (const card of cards) {
    for (const label of unique(pick(card))) {
      const value = filterKey(label);
      const option = options.get(value) ?? { value, label, count: 0 };
      option.count += 1;
      options.set(value, option);
    }
  }
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function countryOptions(cards: JobCard[]): FacetOption[] {
  return facetOptions(cards, (card) => card.countries)
    .map((option) => ({ ...option, label: countryName(option.label) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Cities, each tagged with its country so the list can narrow once a country is picked. */
export function placeOptions(cards: JobCard[]): FacetOption[] {
  const countryOf = new Map<string, string>();
  for (const card of cards) {
    for (const location of card.places) {
      const key = filterKey(location);
      if (!countryOf.has(key) && card.countries.length === 1) countryOf.set(key, filterKey(card.countries[0]));
    }
  }
  return facetOptions(cards, (card) => card.places).map((option) => ({
    ...option,
    country: countryOf.get(option.value),
  }));
}

export function matchesFilters(facets: JobFacets, filters: JobFilters): boolean {
  const terms = filterKey(filters.q).split(/\s+/).filter(Boolean);
  if (terms.some((term) => !facets.search.includes(term))) return false;
  if (filters.country && !facets.countries.includes(filters.country)) return false;
  if (filters.location && !facets.places.includes(filters.location)) return false;
  if (filters.dept && facets.dept !== filters.dept) return false;
  if (filters.mode && facets.mode !== filters.mode) return false;
  if (filters.type && facets.type !== filters.type) return false;
  return true;
}

/** Reads filters from the query string. ?filter= is the old name for the employment type. */
export function filtersFromParams(params: URLSearchParams): JobFilters {
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])) as JobFilters;
  for (const key of FILTER_KEYS) filters[key] = key === 'q' ? (params.get(key) ?? '').trim() : filterKey(params.get(key));
  if (!filters.type) filters.type = filterKey(params.get('filter'));
  return filters;
}

export function formatApplyBy(date: string): string {
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parsed);
}
