function initAboutGlobalPins() {
  const root = document.querySelector('[data-about-global]');
  if (!(root instanceof HTMLElement)) return;

  const pins = root.querySelectorAll('.about-global-pin');
  if (!pins.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) {
    pins.forEach((pin) => pin.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        pins.forEach((pin) => pin.classList.add('is-visible'));
        observer.disconnect();
      });
    },
    { threshold: 0.35 },
  );
  observer.observe(root);
}

initAboutGlobalPins();
