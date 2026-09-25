function industryNames(card: HTMLElement): string[] {
  try {
    const parsed = JSON.parse(card.dataset.industries || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((name): name is string => typeof name === 'string');
  } catch {
    return [];
  }
}

function syncCaseStudySides(list: HTMLElement) {
  const cards = [...list.querySelectorAll<HTMLElement>('[data-case-study]')].filter((card) => {
    const item = card.closest('li');
    return !(item instanceof HTMLElement && item.hidden);
  });
  cards.forEach((card, index) => {
    const fromLeft = index % 2 === 0;
    card.classList.toggle('is-from-left', fromLeft);
    card.classList.toggle('is-from-right', !fromLeft);
    card.classList.toggle('is-image-first', !fromLeft);
  });
}

function initCaseStudiesListing() {
  const heading = document.getElementById('case-studies-banner-heading');
  if (heading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(heading);
  } else if (heading) {
    heading.classList.add('is-visible');
  }

  const select = document.querySelector<HTMLSelectElement>('[data-case-industry]');
  const list = document.querySelector<HTMLElement>('.cs-list');
  const empty = document.querySelector<HTMLElement>('[data-case-empty]');
  if (!select || !list) return;

  const apply = () => {
    const selected = select.value;
    list.querySelectorAll<HTMLElement>('[data-case-study]').forEach((card) => {
      const item = card.closest('li');
      if (!(item instanceof HTMLElement)) return;
      const names = industryNames(card);
      item.hidden = Boolean(selected) && !names.includes(selected);
    });
    syncCaseStudySides(list);
    const visible = [...list.querySelectorAll('li')].filter((item) => !item.hidden).length;
    if (empty) empty.hidden = visible > 0;
  };

  select.addEventListener('change', apply);
  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseStudiesListing);
} else {
  initCaseStudiesListing();
}
