import { FILTER_KEYS, filtersFromParams, matchesFilters, type FilterKey, type JobFacets } from '../lib/jobs-board';

const split = (value: string | undefined) => (value ? value.split('|') : []);

function initJobsOpeningsBoard() {
  const root = document.querySelector('[data-jobs-live]');
  if (!(root instanceof HTMLElement) || root.dataset.jobsReady === 'true') return;
  root.dataset.jobsReady = 'true';

  const form = root.querySelector<HTMLFormElement>('[data-jobs-filters]');
  const fields = new Map<FilterKey, HTMLInputElement | HTMLSelectElement>();
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-jobs-filter]').forEach((field) => {
    fields.set(field.dataset.jobsFilter as FilterKey, field);
  });
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-jobs-country]')];
  const summary = root.querySelector<HTMLElement>('[data-jobs-summary]');
  const empty = root.querySelector<HTMLElement>('[data-jobs-empty]');
  const list = root.querySelector<HTMLElement>('[data-jobs-list]');
  const clears = [...root.querySelectorAll<HTMLButtonElement>('[data-jobs-clear]')];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-jobs-card]')].map((el) => ({
    el,
    facets: {
      search: el.dataset.search ?? '',
      countries: split(el.dataset.countries),
      places: split(el.dataset.places),
      dept: el.dataset.dept ?? '',
      mode: el.dataset.mode ?? '',
      type: el.dataset.type ?? '',
    } satisfies JobFacets,
  }));

  const filters = filtersFromParams(new URLSearchParams(window.location.search));
  // Values with nothing to match (a stale link, or a filter not shown for this set of roles) fall back to all.
  for (const key of FILTER_KEYS) {
    if (key === 'q') continue;
    const options = key === 'country' ? chips.map((chip) => chip.dataset.jobsCountry) : [...((fields.get(key) as HTMLSelectElement | undefined)?.options ?? [])].map((o) => o.value);
    if (!options.includes(filters[key])) filters[key] = '';
  }

  const placeSelect = fields.get('location') as HTMLSelectElement | undefined;
  const narrowPlaces = () => {
    if (!placeSelect) return;
    for (const option of placeSelect.options) {
      option.hidden = !!option.value && !!filters.country && !!option.dataset.country && option.dataset.country !== filters.country;
    }
    if (placeSelect.selectedOptions[0]?.hidden) {
      placeSelect.value = '';
      filters.location = '';
    }
  };

  const syncUrl = () => {
    const params = new URLSearchParams(window.location.search);
    for (const key of [...FILTER_KEYS, 'filter']) params.delete(key);
    for (const key of FILTER_KEYS) if (filters[key]) params.set(key, filters[key]);
    const query = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  };

  const apply = () => {
    narrowPlaces();
    let visible = 0;
    for (const card of cards) {
      const show = matchesFilters(card.facets, filters);
      card.el.hidden = !show;
      if (show) visible += 1;
    }
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.jobsCountry === filters.country)));
    const active = FILTER_KEYS.some((key) => filters[key]);
    const noun = (n: number) => `${n} ${n === 1 ? 'role' : 'roles'}`;
    if (summary) summary.textContent = active ? `Showing ${visible} of ${noun(cards.length)}` : `Showing ${noun(cards.length)}`;
    if (list) list.hidden = visible === 0;
    if (empty) empty.hidden = visible !== 0;
    clears.forEach((button) => {
      if (button.closest('[data-jobs-empty]')) return;
      button.hidden = !active || visible === 0;
    });
    syncUrl();
  };

  fields.forEach((field, key) => {
    field.value = filters[key];
    field.addEventListener(field instanceof HTMLSelectElement ? 'change' : 'input', () => {
      filters[key] = key === 'q' ? field.value : field.value.trim().toLowerCase();
      apply();
    });
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filters.country = chip.dataset.jobsCountry ?? '';
      apply();
    });
  });

  clears.forEach((button) => {
    button.addEventListener('click', () => {
      for (const key of FILTER_KEYS) filters[key] = '';
      fields.forEach((field) => (field.value = ''));
      apply();
      fields.get('q')?.focus();
    });
  });

  // Filtering is live; Enter in the search box should not reload the page.
  form?.addEventListener('submit', (event) => event.preventDefault());

  apply();
}

initJobsOpeningsBoard();
