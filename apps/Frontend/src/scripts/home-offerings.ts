function loadHoverVisual(img: HTMLImageElement) {
  const src = img.getAttribute('data-src');
  if (!src || img.getAttribute('src') === src) return;
  img.src = src;
}

function initHomeOfferings() {
  document.querySelectorAll('.offer-col').forEach((column) => {
    const img = column.querySelector('.offer-hover-gif');
    if (!(img instanceof HTMLImageElement)) return;
    const load = () => loadHoverVisual(img);
    column.addEventListener('pointerenter', load, { passive: true });
    column.addEventListener('focusin', load);
  });
}

initHomeOfferings();