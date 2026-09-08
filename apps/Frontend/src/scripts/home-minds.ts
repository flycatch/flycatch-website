const HOLD_MS = 2500;

function initHomeMindsStats() {
  const root = document.querySelector('[data-minds-stats]');
  if (!(root instanceof HTMLElement)) return;

  const items = [...root.querySelectorAll('[data-stat-index]')];
  const count = items.length;
  if (count < 2) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let timer = 0;

  const resetLeaving = (el: Element) => {
    const finish = (event?: Event) => {
      if (event instanceof TransitionEvent && event.propertyName !== 'transform') return;
      el.classList.remove('is-leaving');
      el.classList.add('is-prep');
      void (el as HTMLElement).offsetWidth;
      el.classList.remove('is-prep');
      el.removeEventListener('transitionend', finish);
    };
    if (reduce.matches) {
      el.classList.remove('is-leaving');
      return;
    }
    el.addEventListener('transitionend', finish);
  };

  const setActive = (index: number, animate = true) => {
    const next = ((index % count) + count) % count;
    items.forEach((el, i) => {
      const isNext = i === next;
      const isPrev = animate && i === active && i !== next;
      el.classList.toggle('is-active', isNext);
      el.classList.toggle('is-leaving', Boolean(isPrev));
      el.setAttribute('aria-hidden', isNext ? 'false' : 'true');
      if (isPrev) resetLeaving(el);
    });
    active = next;
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
  };

  const play = () => {
    stop();
    if (reduce.matches || document.hidden) return;
    timer = window.setInterval(() => setActive(active + 1), HOLD_MS);
  };

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', play);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget as Node)) play();
  });
  document.addEventListener('visibilitychange', play);
  reduce.addEventListener('change', play);

  setActive(0, false);
  play();
}

initHomeMindsStats();
