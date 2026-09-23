function initJobsBoard() {
  const root = document.querySelector('[data-jobs-board]');
  if (!(root instanceof HTMLElement)) return;

  const select = root.querySelector<HTMLSelectElement>('[data-jobs-filter]');
  const empty = root.querySelector<HTMLElement>('[data-jobs-empty]');
  const groups = [...root.querySelectorAll<HTMLElement>('[data-jobs-group]')];
  const cards = [...root.querySelectorAll<HTMLElement>('.jobs-card')];
  const params = new URLSearchParams(window.location.search);
  const typeFilter = params.get('type') || '';

  const setOpen = (group: HTMLElement, open: boolean) => {
    group.classList.toggle('is-open', open);
    group.querySelector('[data-jobs-toggle]')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  groups.forEach((group) => {
    group.querySelector('[data-jobs-toggle]')?.addEventListener('click', () => {
      const willOpen = !group.classList.contains('is-open');
      groups.forEach((item) => setOpen(item, false));
      if (willOpen) setOpen(group, true);
    });
  });

  const apply = () => {
    const category = select?.value || '';
    let visible = 0;

    if (groups.length > 0) {
      groups.forEach((group) => {
        const groupCards = [...group.querySelectorAll<HTMLElement>('.jobs-card')];
        let groupVisible = 0;
        groupCards.forEach((card) => {
          const typeOk = !typeFilter || card.dataset.jobType === typeFilter;
          const catOk = !category || card.dataset.jobSpecialization === category;
          const show = typeOk && catOk;
          card.hidden = !show;
          if (show) groupVisible += 1;
        });
        group.hidden = groupVisible === 0;
        if (group.hidden) setOpen(group, false);
        const count = group.querySelector('[data-jobs-count]');
        if (count) count.textContent = String(groupVisible);
        visible += groupVisible;
      });
    } else {
      cards.forEach((card) => {
        const typeOk = !typeFilter || card.dataset.jobType === typeFilter;
        const catOk = !category || card.dataset.jobSpecialization === category;
        const show = typeOk && catOk;
        card.hidden = !show;
        if (show) visible += 1;
      });
    }

    if (empty) empty.hidden = visible !== 0;
  };

  select?.addEventListener('change', apply);
  apply();
}

initJobsBoard();
