import { t } from '../lib/i18n';
import { newsMetaLabel } from '../lib/news-media';
import { resourceAssetUrl, resourceThumbnailUrl } from '../lib/resource-media';

type ResourceCategory = { name: string };
type ResourceItem = {
  title: string;
  slug: string;
  reading_time: number;
  image_key: string | null;
  pdf_key: string | null;
  created_at?: string;
  resource_categories?: ResourceCategory[];
  seo?: { image_alt?: string };
};

type ResourcePage = {
  items?: ResourceItem[];
  page?: number;
  per_page?: number;
  total?: number;
};

function renderCard(item: ResourceItem) {
  const categoryNames = (item.resource_categories || []).map((category) => category.name).filter(Boolean);
  const article = document.createElement('article');
  article.className = 'resource-card';
  article.dataset.resourceCard = '';
  article.dataset.categories = categoryNames.join('|');

  const media = document.createElement('div');
  media.className = 'resource-media';
  const image = resourceThumbnailUrl(item.image_key);
  const pdf = resourceAssetUrl(item.pdf_key);
  const alt = item.seo?.image_alt || item.title;
  if (image) {
    const img = document.createElement('img');
    img.src = image;
    img.alt = alt;
    img.width = 640;
    img.height = 360;
    img.loading = 'lazy';
    if (pdf) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'resource-media-button';
      button.dataset.resourceOpen = '';
      button.dataset.pdf = pdf;
      button.dataset.title = item.title;
      button.setAttribute('aria-label', t('resources.open_pdf', { title: item.title }));
      button.append(img);
      media.append(button);
    } else {
      media.append(img);
    }
  }

  const copy = document.createElement('div');
  copy.className = 'resource-copy';

  const meta = document.createElement('p');
  meta.className = 'resource-meta';
  const label = newsMetaLabel(item.reading_time, item.created_at);
  if (item.created_at) {
    const time = document.createElement('time');
    time.dateTime = item.created_at;
    time.textContent = label;
    meta.append(time);
  } else {
    meta.textContent = label;
  }
  copy.append(meta);

  const title = document.createElement('h2');
  title.className = 'resource-title';
  title.textContent = item.title;
  copy.append(title);

  article.append(media, copy);
  return article;
}

function initCategoryMenu(root: HTMLElement, onChange: () => void) {
  const menuRoot = root.querySelector<HTMLElement>('[data-resources-category-root]');
  const trigger = root.querySelector<HTMLButtonElement>('[data-resources-category-trigger]');
  const menu = root.querySelector<HTMLElement>('[data-resources-category-menu]');
  const label = root.querySelector<HTMLElement>('[data-resources-category-label]');
  const input = root.querySelector<HTMLInputElement>('[data-resources-category]');
  if (!menuRoot || !trigger || !menu || !label || !input) return input;

  const close = () => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };

  trigger.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  menu.querySelectorAll<HTMLElement>('[data-value]').forEach((option) => {
    option.addEventListener('click', () => {
      input.value = option.dataset.value || '';
      label.textContent = option.textContent || '';
      menu.querySelectorAll('[aria-selected="true"]').forEach((item) => item.setAttribute('aria-selected', 'false'));
      option.setAttribute('aria-selected', 'true');
      close();
      onChange();
    });
  });

  document.addEventListener('click', (event) => {
    if (!menuRoot.contains(event.target as Node)) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  return input;
}

function viewerPdfUrl(value: string) {
  if (value.startsWith('/api/v1/public/media/')) return value;
  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    if (url.origin === window.location.origin) {
      return url.pathname.startsWith('/api/v1/public/media/') ? `${url.pathname}${url.search}` : '';
    }
    return url.href;
  } catch {
    return '';
  }
}

function initPdfModal(root: HTMLElement) {
  const modal = root.querySelector<HTMLElement>('[data-resource-pdf]');
  const frame = root.querySelector<HTMLIFrameElement>('[data-resource-pdf-frame]');
  const title = root.querySelector<HTMLElement>('[data-resource-pdf-title]');
  const status = root.querySelector<HTMLElement>('[data-resource-pdf-status]');
  const closeButton = root.querySelector<HTMLButtonElement>('[data-resource-pdf-close]');
  const backdrop = root.querySelector<HTMLButtonElement>('[data-resource-pdf-backdrop]');
  if (!modal || !frame || !title || !status || !closeButton || !backdrop) return;

  let opener: HTMLElement | null = null;
  let previousOverflow = '';
  let objectUrl = '';
  let request = 0;

  const release = () => {
    if (!objectUrl) return;
    URL.revokeObjectURL(objectUrl);
    objectUrl = '';
  };

  const close = () => {
    if (modal.hidden) return;
    request += 1;
    modal.hidden = true;
    frame.src = 'about:blank';
    frame.hidden = true;
    status.hidden = true;
    release();
    document.body.classList.remove('resource-modal-open');
    document.body.style.overflow = previousOverflow;
    opener?.focus();
    opener = null;
  };

  const open = (pdf: string, name: string, source: HTMLElement) => {
    const safePdf = viewerPdfUrl(pdf);
    if (!safePdf) return;
    const id = ++request;
    opener = source;
    const label = name || t('resources.pdf_preview');
    title.textContent = label;
    frame.title = label;
    frame.src = 'about:blank';
    frame.hidden = true;
    status.hidden = false;
    status.textContent = t('resources.loading');
    release();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('resource-modal-open');
    modal.hidden = false;
    closeButton.focus();

    void fetch(safePdf)
      .then(async (response) => {
        if (!response.ok) throw new Error('pdf');
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (id !== request) return;
        objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
        frame.src = objectUrl;
        frame.hidden = false;
        status.hidden = true;
      })
      .catch(() => {
        if (id !== request) return;
        frame.hidden = true;
        status.hidden = false;
        status.textContent = t('home.error');
      });
  };

  root.addEventListener('click', (event) => {
    const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-resource-open]');
    if (!trigger || !root.contains(trigger)) return;
    const pdf = trigger.dataset.pdf || '';
    if (!pdf) return;
    event.preventDefault();
    open(pdf, trigger.dataset.title || '', trigger);
  });

  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      event.preventDefault();
      close();
    }
  });
}

function initResourcesListing() {
  const root = document.querySelector('[data-resources-listing]');
  if (!(root instanceof HTMLElement) || root.dataset.resourcesError === 'true') return;

  const grid = root.querySelector<HTMLElement>('[data-resources-grid]');
  const empty = root.querySelector<HTMLElement>('[data-resources-empty]');
  const loading = root.querySelector<HTMLElement>('[data-resources-loading]');
  const sentinel = root.querySelector<HTMLElement>('[data-resources-sentinel]');
  if (!grid || !sentinel) return;

  let page = Number(root.dataset.resourcesPage || '1');
  let total = Number(root.dataset.resourcesTotal || '0');
  const perPage = Number(root.dataset.resourcesPerPage || '10');
  let query = '';
  let category = '';
  let pending = false;
  let done = page * perPage >= total;
  let requestId = 0;
  let searchTimer = 0;

  const cards = () => [...grid.querySelectorAll<HTMLElement>('[data-resource-card]')];

  const apply = () => {
    let visible = 0;
    cards().forEach((card) => {
      const categories = (card.dataset.categories || '')
        .split('|')
        .map((name) => name.trim())
        .filter(Boolean);
      const show = !category || categories.includes(category);
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (empty) empty.hidden = pending || visible !== 0;
  };

  const setLoading = (value: boolean) => {
    pending = value;
    if (loading) loading.hidden = !value;
    apply();
  };

  const appendItems = (items: ResourceItem[]) => {
    const seen = new Set(cards().map((card) => card.dataset.slug));
    items.forEach((item) => {
      if (seen.has(item.slug)) return;
      seen.add(item.slug);
      const card = renderCard(item);
      card.dataset.slug = item.slug;
      grid.append(card);
    });
  };

  const fetchPage = async (nextPage: number, nextQuery: string, replace: boolean) => {
    const id = ++requestId;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(nextPage),
      per_page: String(perPage),
    });
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    try {
      const response = await fetch(`/api/v1/public/resources?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('resource page failed');
      const data = (await response.json()) as ResourcePage;
      if (id !== requestId) return;
      const items = Array.isArray(data.items) ? data.items : [];
      if (replace) grid.replaceChildren();
      appendItems(items);
      page = typeof data.page === 'number' ? data.page : nextPage;
      total = typeof data.total === 'number' ? data.total : total;
      done = items.length === 0 || page * perPage >= total;
    } catch {
      if (id !== requestId) return;
      done = true;
    } finally {
      if (id === requestId) setLoading(false);
    }
  };

  const fillCategory = async () => {
    let guard = 0;
    while (category && !done && guard < 30) {
      const visible = cards().filter((card) => !card.hidden).length;
      if (visible >= perPage) break;
      const previous = page;
      await fetchPage(page + 1, query, false);
      guard += 1;
      if (page === previous) break;
    }
  };

  const loadMore = async () => {
    if (pending || done) return;
    await fetchPage(page + 1, query, false);
    await fillCategory();
  };

  const resetSearch = (value: string) => {
    query = value;
    done = false;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(async () => {
      await fetchPage(1, query, true);
      await fillCategory();
    }, 250);
  };

  const categoryInput = initCategoryMenu(root, () => {
    category = categoryInput?.value || '';
    apply();
    void fillCategory();
  });

  initPdfModal(root);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: '480px 0px' },
    );
    observer.observe(sentinel);
  }

  document.addEventListener('resources-search', (event) => {
    const detail = (event as CustomEvent<{ value?: string }>).detail;
    resetSearch(detail?.value || '');
  });

  cards().forEach((card) => {
    const slug = card.dataset.slug;
    if (slug) card.dataset.slug = slug;
  });
  apply();
}

initResourcesListing();
