function initCreditLifeReveal() {
  const nodes = document.querySelectorAll('[data-cl-reveal]');
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

initCreditLifeReveal();
