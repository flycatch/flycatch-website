const HOLD_MS = 3500;

function initHomeServices() {
  const root = document.querySelector('[data-services-stage]');
  if (!(root instanceof HTMLElement)) return;

  const parts = [...root.querySelectorAll('[data-service-index]')];
  const navItems = [...root.querySelectorAll('[data-service-nav] [data-service-index]')];
  const count = navItems.length;
  if (count === 0) return;

  const arrow = root.querySelector('.services-nav-arrow');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let timer = 0;

  const positionArrow = () => {
    const current = navItems[active];
    if (!(arrow instanceof HTMLElement) || !(current instanceof HTMLElement)) return;
    const y = current.offsetTop + (current.offsetHeight - arrow.offsetHeight) / 2;
    arrow.style.setProperty('--services-arrow-y', `${Math.max(0, y)}px`);
  };

  const setActive = (index: number) => {
    active = ((index % count) + count) % count;
    parts.forEach((el) => {
      const on = Number(el.getAttribute('data-service-index')) === active;
      el.classList.toggle('is-active', on);
      if (el instanceof HTMLButtonElement) {
        el.setAttribute('aria-current', on ? 'true' : 'false');
      }
    });
    positionArrow();
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
  };

  const play = () => {
    stop();
    if (count < 2 || reduce.matches || document.hidden) return;
    timer = window.setInterval(() => setActive(active + 1), HOLD_MS);
  };

  const inner = root.querySelector('.services-stage-inner');

  navItems.forEach((el) => {
    el.addEventListener('click', () => {
      setActive(Number(el.getAttribute('data-service-index')));
      if (inner instanceof HTMLElement && inner.matches(':hover')) return;
      play();
    });
  });

  if (inner instanceof HTMLElement) {
    inner.addEventListener('mouseenter', stop);
    inner.addEventListener('mouseleave', play);
    inner.addEventListener('focusin', stop);
    inner.addEventListener('focusout', (event) => {
      if (!inner.contains(event.relatedTarget as Node)) play();
    });
  }

  document.addEventListener('visibilitychange', play);
  reduce.addEventListener('change', play);
  window.addEventListener('resize', positionArrow);

  setActive(0);
  play();
}

initHomeServices();
