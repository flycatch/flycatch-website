const rows = document.querySelectorAll('[data-services-core-row]');
if (rows.length) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    rows.forEach((row) => row.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -40px 0px',
      },
    );
    rows.forEach((row) => observer.observe(row));
  }
}
