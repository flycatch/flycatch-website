function initComBusShowcase() {
  const image = document.querySelector<HTMLElement>('.cb-showcase-image');
  if (!image) return;

  const reveal = () => image.classList.add('is-zoomed');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.2 },
  );
  observer.observe(image);
}

initComBusShowcase();
