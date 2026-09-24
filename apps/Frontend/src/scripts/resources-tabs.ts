function initResourcesTabs() {
  const roots = document.querySelectorAll<HTMLElement>('[data-resources-tabs]');
  roots.forEach((root) => {
    const input = root.querySelector<HTMLInputElement>('[data-resources-search]');
    const mirror = root.querySelector<HTMLElement>('[data-resources-search-mirror]');
    const inner = root.querySelector<HTMLElement>('.resources-tabs-inner');
    const nav = root.querySelector<HTMLElement>('.resources-tabs-nav');
    const search = root.querySelector<HTMLElement>('.resources-search');
    if (!input || !inner || !nav || !search) return;

    const syncWidth = () => {
      const stacked = getComputedStyle(inner).flexDirection === 'column';
      if (stacked) {
        input.style.width = '100%';
        return;
      }
      if (!mirror) return;
      mirror.textContent = input.value || input.placeholder || '';
      search.classList.toggle('is-filled', input.value.length > 0);
      const icon = search.querySelector('svg');
      const iconWidth = icon instanceof SVGElement ? icon.getBoundingClientRect().width : 24;
      const styles = getComputedStyle(search);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 8;
      const available = Math.max(0, inner.clientWidth - nav.offsetWidth - iconWidth - gap - 48);
      const desired = mirror.offsetWidth + 8;
      input.style.width = `${Math.min(Math.max(desired, 128), available || 128, 250)}px`;
    };

    input.addEventListener('input', () => {
      syncWidth();
      document.dispatchEvent(
        new CustomEvent('resources-search', { detail: { value: input.value } }),
      );
    });
    window.addEventListener('resize', syncWidth);
    syncWidth();
  });
}

initResourcesTabs();
