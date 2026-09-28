const ENTRANCE_SELECTOR = [
  '[data-hero-entrance]',
  '[data-section-reveal]',
  '[data-pf-reveal]',
  '[data-cl-reveal]',
  '[data-acs-reveal]',
  '[data-cb-reveal]',
  '[data-ucd-reveal]',
].join(', ');

function markedNodes(): NodeListOf<Element> {
  return document.querySelectorAll(ENTRANCE_SELECTOR);
}

function reveal(el: Element): void {
  el.classList.add('is-visible');
}

function revealAll(nodes: NodeListOf<Element> | Element[]): void {
  nodes.forEach(reveal);
}

function observeOnce(nodes: NodeListOf<Element>): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1 },
  );
  nodes.forEach((node) => observer.observe(node));
}

function initHeroEntrance(): void {
  const nodes = markedNodes();
  if (!nodes.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealPending = () => {
    revealAll(markedNodes());
  };

  reduceMotion.addEventListener('change', (event) => {
    if (event.matches) revealPending();
  });

  if (reduceMotion.matches) {
    revealAll(nodes);
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      observeOnce(nodes);
    });
  });
}

initHeroEntrance();
