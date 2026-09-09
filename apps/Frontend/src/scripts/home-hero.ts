function initHomeHeroExplore() {
  const copy = document.querySelector('[data-hero-copy]');
  const heading = copy?.querySelector('.hero-heading');
  const explore = copy?.querySelector('.explore');
  if (
    !(copy instanceof HTMLElement) ||
    !(heading instanceof HTMLElement) ||
    !(explore instanceof HTMLElement)
  ) {
    return;
  }

  const sync = () => {
    explore.classList.remove('is-stowed');
    const wrapped = explore.getBoundingClientRect().top > heading.getBoundingClientRect().top + 1;
    explore.classList.toggle('is-stowed', wrapped);
  };

  sync();
  window.addEventListener('resize', sync, { passive: true });
  document.fonts?.ready.then(sync).catch(() => undefined);
}

initHomeHeroExplore();
