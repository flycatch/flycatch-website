function initCaseStudyDetail() {
  const heading = document.getElementById('case-study-heading');
  if (!heading) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heading.classList.add('is-visible');
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    { threshold: 0.4 },
  );
  observer.observe(heading);
}

initCaseStudyDetail();
