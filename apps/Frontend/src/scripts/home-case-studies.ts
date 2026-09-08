function sectionProgress(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const view = window.innerHeight;
  const range = Math.max(rect.height, 1);
  return Math.min(1, Math.max(0, (view - rect.top) / range));
}

function initCaseStudiesProgress() {
  const section = document.querySelector('[data-case-progress]');
  const circle = section?.querySelector('.case-works');
  const fill = section?.querySelector('.case-works-fill');
  if (
    !(section instanceof HTMLElement) ||
    !(circle instanceof HTMLElement) ||
    !(fill instanceof SVGGeometryElement)
  ) {
    return;
  }

  const length = fill.getTotalLength() || 2 * Math.PI * 17;
  fill.style.strokeDasharray = `${length}`;
  fill.style.strokeDashoffset = `${length}`;

  let frame = 0;
  const update = () => {
    frame = 0;
    const progress = sectionProgress(section);
    fill.style.strokeDashoffset = `${length * (1 - progress)}`;
    circle.classList.toggle('is-complete', progress >= 1);
  };

  const onScroll = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaseStudiesProgress);
} else {
  initCaseStudiesProgress();
}
