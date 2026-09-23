const CATEGORY_LABELS: Record<string, string> = {
  'Full-Time': 'All',
  Contract: 'Contract',
};

function initJobsOpeningsBoard() {
  const root = document.querySelector('[data-jobs-live]');
  if (!(root instanceof HTMLElement) || root.dataset.jobsReady === 'true') return;
  root.dataset.jobsReady = 'true';

  const dropdown = root.querySelector<HTMLElement>('[data-jobs-dropdown]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-jobs-dropdown-toggle]');
  const label = root.querySelector<HTMLElement>('[data-jobs-dropdown-label]');
  const menu = root.querySelector<HTMLElement>('[data-jobs-dropdown-menu]');
  const options = [...root.querySelectorAll<HTMLElement>('.jobs-live-option')];
  const empty = root.querySelector<HTMLElement>('[data-jobs-empty]');
  const accordion = root.querySelector<HTMLElement>('[data-jobs-accordion]');
  const groups = [...root.querySelectorAll<HTMLElement>('[data-jobs-group]')];
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('filter') || params.get('type') || '';
  let category = requested in CATEGORY_LABELS ? requested : '';
  let activeIndex = Math.max(0, options.findIndex((option) => option.dataset.value === category));

  const setOpen = (group: HTMLElement, open: boolean) => {
    group.classList.toggle('is-open', open);
    group.querySelector('[data-jobs-toggle]')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const setMenuOpen = (open: boolean) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
    if (open) {
      options.forEach((option, index) => {
        option.classList.toggle('is-active', index === activeIndex);
      });
      options[activeIndex]?.focus();
    }
  };

  const setCategory = (value: string) => {
    category = value in CATEGORY_LABELS ? value : '';
    if (label) label.textContent = CATEGORY_LABELS[category] || 'Select categories';
    toggle?.classList.toggle('is-placeholder', category === '');
    options.forEach((option) => {
      const selected = option.dataset.value === category;
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    activeIndex = Math.max(0, options.findIndex((option) => option.dataset.value === category));
  };

  const apply = () => {
    let visible = 0;
    groups.forEach((group) => {
      const cards = [...group.querySelectorAll<HTMLElement>('.jobs-live-card')];
      let groupVisible = 0;
      cards.forEach((card) => {
        const show = !category || card.dataset.jobType === category;
        card.hidden = !show;
        if (show) groupVisible += 1;
      });
      group.hidden = groupVisible === 0;
      if (group.hidden) setOpen(group, false);
      const count = group.querySelector('[data-jobs-count]');
      if (count) count.textContent = String(groupVisible);
      visible += groupVisible;
    });
    if (empty) empty.hidden = visible !== 0;
    if (accordion) accordion.hidden = visible === 0;
  };

  groups.forEach((group) => {
    group.querySelector('[data-jobs-toggle]')?.addEventListener('click', () => {
      const willOpen = !group.classList.contains('is-open');
      groups.forEach((item) => setOpen(item, false));
      if (willOpen) setOpen(group, true);
    });
  });

  toggle?.addEventListener('click', () => {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  options.forEach((option, index) => {
    option.addEventListener('click', () => {
      setCategory(option.dataset.value || '');
      setMenuOpen(false);
      toggle?.focus();
      apply();
    });
    option.addEventListener('mousemove', () => {
      activeIndex = index;
      options.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === activeIndex));
    });
  });

  toggle?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.key === 'ArrowUp') activeIndex = options.length - 1;
      if (event.key === 'ArrowDown') activeIndex = 0;
      setMenuOpen(true);
    }
  });

  menu?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenuOpen(false);
      toggle?.focus();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = event.key === 'ArrowDown'
        ? (activeIndex + 1) % options.length
        : (activeIndex - 1 + options.length) % options.length;
      options.forEach((option, index) => option.classList.toggle('is-active', index === activeIndex));
      options[activeIndex]?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[activeIndex];
      if (!option) return;
      setCategory(option.dataset.value || '');
      setMenuOpen(false);
      toggle?.focus();
      apply();
    }
  });

  document.addEventListener('click', (event) => {
    if (!dropdown || !event.target || dropdown.contains(event.target as Node)) return;
    setMenuOpen(false);
  });

  setCategory(category);
  apply();
}

initJobsOpeningsBoard();
