function initSiteHeader() {
  const header = document.querySelector('.site-header');
  if (!(header instanceof HTMLElement)) return;

  const hoverNav = window.matchMedia('(min-width: 1024px) and (hover: hover)');
  const items = header.querySelectorAll('.nav-item.has-menu');
  let lastY = window.scrollY;
  let closeTimer: number | undefined;

  const setExpanded = (item: Element, open: boolean) => {
    item.classList.toggle('is-open', open);
    const trigger = item.querySelector('.nav-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const closeMenus = () => {
    items.forEach((item) => setExpanded(item, false));
  };

  const cancelClose = () => {
    if (closeTimer !== undefined) {
      window.clearTimeout(closeTimer);
      closeTimer = undefined;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer = window.setTimeout(() => {
      closeMenus();
      closeTimer = undefined;
    }, 200);
  };

  items.forEach((item) => {
    const trigger = item.querySelector('.nav-trigger');
    if (!(trigger instanceof HTMLButtonElement)) return;

    trigger.addEventListener('click', (event) => {
      if (hoverNav.matches) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const willOpen = !item.classList.contains('is-open');
      closeMenus();
      setExpanded(item, willOpen);
    });

    item.addEventListener('mouseenter', () => {
      if (!hoverNav.matches) return;
      cancelClose();
      items.forEach((other) => setExpanded(other, other === item));
    });
  });

  header.addEventListener('mouseenter', () => {
    if (hoverNav.matches) cancelClose();
  });

  header.addEventListener('mouseleave', () => {
    if (hoverNav.matches) scheduleClose();
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target as Node)) closeMenus();
  });

  const syncHeader = () => {
    const y = window.scrollY;
    const mobile = header.querySelector('.mobile-nav');
    const mobileOpen = mobile instanceof HTMLDetailsElement && mobile.open;
    const goingDown = y > lastY + 2;
    const goingUp = y < lastY - 2;

    if (goingDown && y > 16 && !mobileOpen) {
      header.classList.add('is-hidden');
      closeMenus();
    } else if (goingUp || y <= 8) {
      header.classList.remove('is-hidden');
    }

    if (header.dataset.tone === 'dark') {
      const showSolid = y > 8 && !header.classList.contains('is-hidden');
      header.classList.toggle('is-scrolled', showSolid);
    }

    lastY = y;
  };

  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();
}

initSiteHeader();
