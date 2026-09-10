const HOLD_MS = 2500;
const COMPACT_QUERY = '(max-width: 1024px)';

function countDuration(target: number) {
  return Math.min(1600, 450 + target * 22);
}

function animateCount(el: HTMLElement, target: number, reduce: boolean) {
  const finish = () => {
    el.textContent = String(target);
  };
  if (reduce || target <= 1) {
    finish();
    return;
  }

  const duration = countDuration(target);
  const started = performance.now();
  el.textContent = '1';

  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - progress) ** 3;
    const value = Math.max(1, Math.round(eased * target));
    el.textContent = String(value);
    if (progress < 1) requestAnimationFrame(tick);
    else finish();
  };

  requestAnimationFrame(tick);
}

function numberEl(item: Element) {
  const el = item.querySelector('.minds-stat-number');
  return el instanceof HTMLElement ? el : null;
}

function targetOf(el: HTMLElement) {
  const raw = el.getAttribute('data-stat-target') || el.textContent || '0';
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function restoreTargets(items: Element[]) {
  items.forEach((item) => {
    const el = numberEl(item);
    if (el) el.textContent = String(targetOf(el));
  });
}

function initHomeMindsStats() {
  const root = document.querySelector('[data-minds-stats]');
  const section = document.getElementById('about-us');
  if (!(root instanceof HTMLElement)) return;

  const items = [...root.querySelectorAll('[data-stat-index]')];
  const count = items.length;
  if (count < 2) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia(COMPACT_QUERY);
  let active = 0;
  let timer = 0;
  let compactCounted = false;
  let inView = false;

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
    if (compact.matches || reduce.matches || document.hidden) return;
    timer = window.setInterval(() => setActive(active + 1), HOLD_MS);
  };

  const showAllCompact = () => {
    stop();
    items.forEach((el) => {
      el.classList.remove('is-leaving', 'is-prep');
      el.classList.add('is-active');
      el.setAttribute('aria-hidden', 'false');
    });
  };

  const resetToStart = () => {
    items.forEach((item) => {
      const el = numberEl(item);
      if (!el) return;
      el.textContent = reduce.matches ? String(targetOf(el)) : '1';
    });
  };

  const countAllCompact = () => {
    if (compactCounted || !compact.matches) return;
    compactCounted = true;
    items.forEach((item) => {
      const el = numberEl(item);
      if (el) animateCount(el, targetOf(el), reduce.matches);
    });
  };

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', play);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget as Node)) play();
  });
  document.addEventListener('visibilitychange', play);
  reduce.addEventListener('change', play);
  compact.addEventListener('change', () => {
    if (compact.matches) {
      showAllCompact();
      compactCounted = false;
      if (inView) countAllCompact();
      else resetToStart();
      return;
    }
    restoreTargets(items);
    items.forEach((el, i) => {
      el.classList.toggle('is-active', i === active);
      el.setAttribute('aria-hidden', i === active ? 'false' : 'true');
    });
    play();
  });

  if (compact.matches) {
    showAllCompact();
    resetToStart();
  } else {
    setActive(0, false);
    play();
  }

  const target = section instanceof HTMLElement ? section : root;
  const observer = new IntersectionObserver(
    (entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      if (inView && compact.matches) countAllCompact();
    },
    { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
  );
  observer.observe(target);
}

initHomeMindsStats();
