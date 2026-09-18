function initComBusReveal() {
  const nodes = document.querySelectorAll('[data-cb-reveal]');
  if (!nodes.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.12 },
  );
  nodes.forEach((node) => observer.observe(node));
}

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

initComBusReveal();
initComBusShowcase();
