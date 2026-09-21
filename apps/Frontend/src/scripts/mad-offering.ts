function closedAccordionHeight(list: HTMLElement) {
  return Array.from(list.querySelectorAll<HTMLDetailsElement>('.mad-accordion')).reduce((total, item) => {
    const summary = item.querySelector('summary');
    if (!summary) return total;
    const styles = getComputedStyle(item);
    return (
      total +
      summary.getBoundingClientRect().height +
      parseFloat(styles.borderTopWidth) +
      parseFloat(styles.borderBottomWidth)
    );
  }, 0);
}

function syncMadOfferingImage() {
  const body = document.querySelector<HTMLElement>('.mad-offering-body');
  const media = body?.querySelector<HTMLElement>('.mad-offering-media');
  const list = body?.querySelector<HTMLElement>('.mad-offering-list');
  if (!body || !media || !list) return;

  if (!window.matchMedia('(min-width: 1024px)').matches) {
    body.style.removeProperty('--mad-offering-image-height');
    media.classList.remove('is-locked');
    return;
  }

  const height = closedAccordionHeight(list);
  if (height <= 0) return;
  body.style.setProperty('--mad-offering-image-height', `${Math.round(height)}px`);
  media.classList.add('is-locked');
}

function initMadOfferingImage() {
  const list = document.querySelector('.mad-offering-list');
  if (!list) return;

  syncMadOfferingImage();
  window.addEventListener('resize', syncMadOfferingImage);

  const observer = new ResizeObserver(syncMadOfferingImage);
  list.querySelectorAll('summary').forEach((summary) => observer.observe(summary));
}

initMadOfferingImage();
