function countDuration(target: number) {
  return Math.min(1600, 700 + target * 18);
}

function animateCount(el: HTMLElement, target: number, reduce: boolean) {
  const finish = () => {
    el.textContent = String(target);
  };
  if (reduce || target <= 0) {
    finish();
    return;
  }

  const duration = countDuration(target);
  const started = performance.now();
  el.textContent = '0';

  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = String(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(tick);
    else finish();
  };

  requestAnimationFrame(tick);
}

function initAiMindsStats() {
  const root = document.querySelector('[data-ai-minds]');
  if (!(root instanceof HTMLElement)) return;

  const numbers = [...root.querySelectorAll('.ai-minds-stat-number')].filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  );
  if (!numbers.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let played = false;

  const run = () => {
    if (played) return;
    played = true;
    numbers.forEach((el) => {
      const parsed = Number.parseInt(el.getAttribute('data-stat-target') || '0', 10);
      const target = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      animateCount(el, target, reduce.matches);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        run();
        observer.disconnect();
      }
    },
    { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
  );
  observer.observe(root);
}

initAiMindsStats();
