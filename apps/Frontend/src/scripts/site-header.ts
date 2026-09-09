function initSiteHeader() {
  const header = document.querySelector('.site-header');
  if (!(header instanceof HTMLElement)) return;

  const hoverNav = window.matchMedia('(min-width: 1024px) and (hover: hover)');
  const compactNav = window.matchMedia('(max-width: 1024px)');
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

  const toggle = header.querySelector('[data-mobile-toggle]');
  const drawer = document.querySelector('[data-mobile-drawer]');
  const panel = drawer?.querySelector('[data-mobile-panel]');
  const frames = drawer?.querySelector('[data-mobile-frames]');
  const backBtn = drawer?.querySelector('[data-mobile-back]');
  const views = drawer ? [...drawer.querySelectorAll('[data-panel]')] : [];
  let stack = ['root'];
  let drawerOpen = false;
  let lastFocus: HTMLElement | null = null;

  const focusables = () => {
    if (!(panel instanceof HTMLElement)) return [];
    return [...panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((el) => !el.hasAttribute('hidden') && !el.closest('[inert]'));
  };

  const syncViews = (immediate = false) => {
    const current = stack[stack.length - 1];
    if (frames instanceof HTMLElement) {
      frames.classList.toggle('is-instant', immediate);
    }
    views.forEach((view) => {
      if (!(view instanceof HTMLElement)) return;
      const id = view.dataset.panel ?? '';
      const idx = stack.indexOf(id);
      const active = id === current;
      view.classList.toggle('is-active', active);
      view.classList.toggle('is-behind', idx !== -1 && !active);
      view.classList.toggle('is-ahead', idx === -1);
      if (active) view.removeAttribute('inert');
      else view.setAttribute('inert', '');
    });
    drawer?.querySelectorAll('[data-mobile-push]').forEach((el) => {
      const id = el.getAttribute('data-mobile-push');
      el.setAttribute('aria-expanded', id && stack.includes(id) ? 'true' : 'false');
    });
    if (backBtn instanceof HTMLElement) {
      backBtn.hidden = stack.length < 2;
    }
    if (!immediate && frames instanceof HTMLElement) {
      window.requestAnimationFrame(() => frames.classList.remove('is-instant'));
    }
  };

  const setDrawerOpen = (open: boolean) => {
    if (!(drawer instanceof HTMLElement) || !(toggle instanceof HTMLElement)) return;
    drawerOpen = open;
    header.classList.toggle('is-drawer-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('is-mobile-drawer-open', open);

    if (open) {
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      stack = ['root'];
      drawer.hidden = false;
      syncViews(true);
      window.requestAnimationFrame(() => {
        drawer.classList.add('is-open');
        const closeBtn = drawer.querySelector<HTMLElement>('.mobile-drawer-close');
        closeBtn?.focus();
      });
    } else {
      drawer.classList.remove('is-open');
      const finish = () => {
        if (drawerOpen) return;
        drawer.hidden = true;
        stack = ['root'];
        syncViews(true);
        lastFocus?.focus();
      };
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) finish();
      else {
        window.setTimeout(finish, 320);
      }
    }
  };

  const pushView = (id: string) => {
    if (!id || stack[stack.length - 1] === id) return;
    stack = [...stack, id];
    syncViews();
    if (backBtn instanceof HTMLElement) backBtn.focus();
  };

  const popView = () => {
    if (stack.length < 2) return;
    stack = stack.slice(0, -1);
    syncViews();
  };

  if (toggle instanceof HTMLButtonElement && drawer instanceof HTMLElement) {
    toggle.addEventListener('click', () => setDrawerOpen(true));

    drawer.querySelectorAll('[data-mobile-close]').forEach((el) => {
      el.addEventListener('click', () => setDrawerOpen(false));
    });

    if (backBtn instanceof HTMLButtonElement) {
      backBtn.addEventListener('click', popView);
    }

    drawer.querySelectorAll('[data-mobile-push]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-mobile-push');
        if (id) pushView(id);
      });
    });

    drawer.addEventListener('keydown', (event) => {
      if (!drawerOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  compactNav.addEventListener('change', () => {
    if (!compactNav.matches) setDrawerOpen(false);
  });

  const syncHeader = () => {
    const y = window.scrollY;
    const goingDown = y > lastY + 2;
    const goingUp = y < lastY - 2;

    if (goingDown && y > 16 && !drawerOpen) {
      header.classList.add('is-hidden');
      closeMenus();
    } else if (goingUp || y <= 8 || drawerOpen) {
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
