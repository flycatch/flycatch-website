import { describe, expect, it } from 'vitest';
import { toPublicOpening, type CareersOpening } from '../../src/lib/careers-api';
import {
  countryOptions,
  facetOptions,
  filtersFromParams,
  formatApplyBy,
  matchesFilters,
  placeOptions,
  sortCards,
  toJobCard,
  type JobFilters,
} from '../../src/lib/jobs-board';

const base: CareersOpening = {
  id: 'a',
  code: 'FLY-ENG-014',
  title: 'Site Engineer',
  department: 'Engineering',
  locations: [{ label: 'Riyadh', country: 'SA' }],
  workMode: 'On-site',
  employmentType: 'Full-Time',
  expMin: 3,
  expMax: 6,
  qualification: null,
  description: '',
  mandatorySkills: ['AutoCAD', 'Site supervision', 'Safety', 'Primavera'],
  optionalSkills: ['Arabic'],
  applyBy: '2026-12-31',
  acceptingApplications: true,
  datePosted: '2026-10-25T00:00:00.000Z',
  organisation: 'Flycatch Saudi Arabia',
  country: 'SA',
  otpRequired: false,
};

const now = Date.parse('2026-10-28T00:00:00.000Z');
const card = (overrides: Partial<CareersOpening> = {}) => toJobCard(toPublicOpening({ ...base, ...overrides }), now);
const none: JobFilters = { q: '', country: '', location: '', dept: '', mode: '', type: '' };

describe('toJobCard', () => {
  it('surfaces location, mode, type, top skills and the deadline', () => {
    const c = card();
    expect(c).toMatchObject({
      dept: 'Engineering',
      places: ['Riyadh'],
      countries: ['SA'],
      mode: 'On-site',
      type: 'Full-Time',
      experience: '3-6 Years',
      skills: ['AutoCAD', 'Site supervision', 'Safety'],
      applyBy: '2026-12-31',
      isNew: true,
      paused: false,
    });
  });

  it('leaves a missing department empty instead of inventing "Other", and flags old or paused roles', () => {
    const c = card({ department: null, acceptingApplications: false, datePosted: '2026-09-01T00:00:00.000Z' });
    expect(c.dept).toBe('');
    expect(c.isNew).toBe(false);
    expect(c.paused).toBe(true);
  });
});

describe('matchesFilters', () => {
  const c = card();

  it('matches everything with no filters', () => {
    expect(matchesFilters(c.facets, none)).toBe(true);
  });

  it('compares employment type regardless of how the HRMS cased it', () => {
    expect(matchesFilters(card({ employmentType: 'Full-time' }).facets, { ...none, type: 'full-time' })).toBe(true);
    expect(matchesFilters(c.facets, { ...none, type: 'contract' })).toBe(false);
  });

  it('searches title, skills and place, needing every word', () => {
    expect(matchesFilters(c.facets, { ...none, q: 'autocad riyadh' })).toBe(true);
    expect(matchesFilters(c.facets, { ...none, q: 'arabic' })).toBe(true);
    expect(matchesFilters(c.facets, { ...none, q: 'autocad kochi' })).toBe(false);
  });

  it('filters by country, city, department and work mode', () => {
    expect(matchesFilters(c.facets, { ...none, country: 'sa', location: 'riyadh' })).toBe(true);
    expect(matchesFilters(c.facets, { ...none, country: 'in' })).toBe(false);
    expect(matchesFilters(c.facets, { ...none, dept: 'design' })).toBe(false);
    expect(matchesFilters(c.facets, { ...none, mode: 'remote' })).toBe(false);
  });
});

describe('facets', () => {
  const cards = [
    card(),
    card({ code: 'B', locations: [{ label: 'Kochi', country: 'IN' }], country: 'IN', employmentType: 'Full-time' }),
    card({ code: 'C', locations: [{ label: 'Kochi', country: 'IN' }], country: 'IN', employmentType: 'Contract' }),
  ];

  it('counts countries under their display names', () => {
    expect(countryOptions(cards)).toEqual([
      { value: 'in', label: 'India', count: 2 },
      { value: 'sa', label: 'Saudi Arabia', count: 1 },
    ]);
  });

  it('tags each city with its country', () => {
    expect(placeOptions(cards).map((o) => [o.value, o.country, o.count])).toEqual([
      ['kochi', 'in', 2],
      ['riyadh', 'sa', 1],
    ]);
  });

  it('merges values that differ only by case', () => {
    expect(facetOptions(cards, (c) => [c.type]).map((o) => [o.value, o.count])).toEqual([
      ['contract', 1],
      ['full-time', 2],
    ]);
  });
});

describe('sortCards', () => {
  it('lists open roles first, newest first', () => {
    const sorted = sortCards([
      card({ code: 'old', datePosted: '2026-09-01T00:00:00.000Z' }),
      card({ code: 'paused', acceptingApplications: false }),
      card({ code: 'new' }),
    ]);
    expect(sorted.map((c) => c.slug)).toEqual(['new', 'old', 'paused']);
  });
});

describe('filtersFromParams', () => {
  it('reads and normalises the query string, accepting the old ?filter= name', () => {
    expect(filtersFromParams(new URLSearchParams('country=SA&q= React &filter=Full-Time'))).toEqual({
      ...none,
      q: 'React',
      country: 'sa',
      type: 'full-time',
    });
  });
});

describe('formatApplyBy', () => {
  it('formats a date-only deadline without shifting the day', () => {
    expect(formatApplyBy('2026-12-31')).toBe('31 Dec');
    expect(formatApplyBy('nope')).toBe('');
  });
});
