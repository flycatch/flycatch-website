function initContactSphere() {
  const section = document.querySelector('[data-contact-sphere]');
  const img = section?.querySelector('[data-contact-sphere-img]');
  if (!(section instanceof HTMLElement) || !(img instanceof HTMLElement)) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setLive = (on: boolean) => {
    img.classList.toggle('is-live', on && !reduce.matches);
  };

  if (reduce.matches) {
    setLive(false);
    reduce.addEventListener('change', () => setLive(false));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        setLive(entry.isIntersecting);
      });
    },
    { threshold: 0.2 },
  );
  observer.observe(section);

  reduce.addEventListener('change', (event) => {
    if (event.matches) {
      setLive(false);
      observer.disconnect();
    }
  });
}

initContactSphere();
