const heading = document.getElementById('careers-heading');
if (heading) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
        else entry.target.classList.remove('is-visible');
      });
    },
    { threshold: 0.1 },
  );
  observer.observe(heading);
}
