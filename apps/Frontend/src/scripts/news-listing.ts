import { newsMetaLabel, youtubeEmbedUrl } from '../lib/news-media';

type NewsCategory = { name: string };
type NewsItem = {
  title: string;
  slug: string;
  description: string;
  button_name: string;
  reading_time: number;
  image_key: string | null;
  youtube_url: string;
  created_at: string;
  news_categories?: NewsCategory[];
  seo?: { image_alt?: string };
};

type NewsPage = {
  items?: NewsItem[];
  page?: number;
  per_page?: number;
  total?: number;
};

function mediaUrl(key: string | null) {
  if (!key) return null;
  if (key.startsWith('/')) return key;
  return `/api/v1/public/media/${encodeURIComponent(key)}`;
}

function renderItem(item: NewsItem) {
  const categoryNames = (item.news_categories || []).map((category) => category.name).filter(Boolean);
  const article = document.createElement('article');
  article.className = 'news-item news-card';
  article.dataset.newsItem = '';
  article.dataset.categories = categoryNames.join('|');

  const media = document.createElement('div');
  media.className = 'news-media';
  const embed = youtubeEmbedUrl(item.youtube_url);
  if (embed) {
    const frame = document.createElement('iframe');
    frame.src = embed;
    frame.title = item.title;
    frame.loading = 'lazy';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    frame.allowFullscreen = true;
    media.append(frame);
  } else {
    const image = mediaUrl(item.image_key);
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = item.seo?.image_alt || item.title;
      img.width = 600;
      img.height = 400;
      img.loading = 'lazy';
      media.append(img);
    }
  }

  const copy = document.createElement('div');
  copy.className = 'news-copy';

  const meta = document.createElement('p');
  meta.className = 'news-meta';
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
  title.className = 'news-title';
  title.textContent = item.title;
  copy.append(title);

  if (item.description) {
    const description = document.createElement('p');
    description.className = 'news-description';
    description.textContent = item.description;
    copy.append(description);
  }

  const link = document.createElement('a');
  link.className = 'news-read';
  link.href = `/company/news-and-events/${item.slug}`;
  const text = document.createElement('span');
  text.textContent = item.button_name?.trim() || 'Read more';
  const icon = document.createElement('img');
  icon.src = '/icon-arrow-right.svg';
  icon.width = 21;
  icon.height = 21;
  icon.alt = '';
  link.append(text, icon);
  copy.append(link);

  article.append(media, copy);
  return article;
}

function initCategoryMenu(root: HTMLElement, onChange: () => void) {
  const menuRoot = root.querySelector<HTMLElement>('[data-news-category-root]');
  const trigger = root.querySelector<HTMLButtonElement>('[data-news-category-trigger]');
  const menu = root.querySelector<HTMLElement>('[data-news-category-menu]');
  const label = root.querySelector<HTMLElement>('[data-news-category-label]');
  const input = root.querySelector<HTMLInputElement>('[data-news-category]');
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

function initNewsListing() {
  const root = document.querySelector('[data-news-listing]');
  if (!(root instanceof HTMLElement) || root.dataset.newsError === 'true') return;

  const flow = root.querySelector<HTMLElement>('[data-news-flow]');
  const empty = root.querySelector<HTMLElement>('[data-news-empty]');
  const loading = root.querySelector<HTMLElement>('[data-news-loading]');
  const sentinel = root.querySelector<HTMLElement>('[data-news-sentinel]');
  if (!flow || !sentinel) return;

  let page = Number(root.dataset.newsPage || '1');
  let total = Number(root.dataset.newsTotal || '0');
  const perPage = Number(root.dataset.newsPerPage || '10');
  let query = '';
  let category = '';
  let pending = false;
  let done = page * perPage >= total;
  let requestId = 0;
  let searchTimer = 0;

  const cards = () => [...flow.querySelectorAll<HTMLElement>('[data-news-item]')];

  const apply = () => {
    let visible = 0;
    cards().forEach((card) => {
      const categories = (card.dataset.categories || '')
        .split('|')
        .map((name) => name.trim())
        .filter(Boolean);
      const show = !category || categories.includes(category);
      card.hidden = !show;
      card.classList.remove('news-feature', 'news-card');
      if (!show) return;
      card.classList.add(visible === 0 ? 'news-feature' : 'news-card');
      visible += 1;
    });
    if (empty) empty.hidden = pending || visible !== 0;
  };

  const setLoading = (value: boolean) => {
    pending = value;
    if (loading) loading.hidden = !value;
    apply();
  };

  const appendItems = (items: NewsItem[]) => {
    const seen = new Set(cards().map((card) => card.querySelector('a.news-read')?.getAttribute('href')));
    items.forEach((item) => {
      const href = `/company/news-and-events/${item.slug}`;
      if (seen.has(href)) return;
      seen.add(href);
      flow.append(renderItem(item));
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
      const response = await fetch(`/api/v1/public/news?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('news page failed');
      const data = (await response.json()) as NewsPage;
      if (id !== requestId) return;
      const items = Array.isArray(data.items) ? data.items : [];
      if (replace) flow.replaceChildren();
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

  apply();
}

initNewsListing();
