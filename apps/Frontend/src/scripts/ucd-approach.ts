const nodes = document.querySelectorAll('[data-ucd-reveal]');
if (nodes.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.2 },
  );
  nodes.forEach((node) => observer.observe(node));
}
