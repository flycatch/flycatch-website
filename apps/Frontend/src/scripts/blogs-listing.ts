type BlogAuthor = { name: string };
type BlogCategory = { name: string };
type BlogCard = {
  title: string;
  slug: string;
  description: string;
  created_at: string;
  image_key: string | null;
  image_alt: string;
  authors: BlogAuthor[];
  categories: BlogCategory[];
};

type BlogPage = {
  items?: BlogCard[];
  page?: number;
  per_page?: number;
  total?: number;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCreatedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function mediaUrl(key: string | null) {
  if (!key) return null;
  if (key.startsWith('/')) return key;
  return `/api/v1/public/media/${encodeURIComponent(key)}`;
}

function renderCard(blog: BlogCard) {
  const categoryNames = (blog.categories || []).map((category) => category.name).filter(Boolean);
  const authorNames = (blog.authors || []).map((author) => author.name).filter(Boolean);
  const article = document.createElement('article');
  article.className = 'blogs-card';
  article.dataset.blogCard = '';
  article.dataset.search = [blog.title, blog.description, ...categoryNames, ...authorNames].join(' ').trim();
  article.dataset.categories = categoryNames.join('|');

  const link = document.createElement('a');
  link.href = `/blogs/${blog.slug}`;

  const media = document.createElement('div');
  media.className = 'blogs-card-media';
  const image = mediaUrl(blog.image_key);
  if (image) {
    const img = document.createElement('img');
    img.src = image;
    img.alt = blog.image_alt || blog.title;
    img.width = 377;
    img.height = 210;
    img.loading = 'lazy';
    media.append(img);
  }
  link.append(media);

  const body = document.createElement('div');
  body.className = 'blogs-card-body';

  const meta = document.createElement('p');
  meta.className = 'blogs-card-meta';
  const category = document.createElement('span');
  category.className = 'blogs-card-category';
  category.textContent = categoryNames[0] || '';
  meta.append(category);
  const created = formatCreatedDate(blog.created_at);
  if (created) {
    const time = document.createElement('time');
    time.dateTime = blog.created_at;
    time.textContent = created;
    meta.append(time);
  }
  body.append(meta);

  const title = document.createElement('h2');
  title.className = 'blogs-card-title';
  title.textContent = blog.title;
  body.append(title);

  if (categoryNames.length > 0) {
    const tags = document.createElement('div');
    tags.className = 'blogs-card-tags';
    categoryNames.forEach((name) => {
      const tag = document.createElement('span');
      tag.className = 'blogs-card-tag';
      tag.textContent = name;
      tags.append(tag);
    });
    body.append(tags);
  }

  link.append(body);
  article.append(link);
  return article;
}

function initCategoryMenu(root: HTMLElement, onChange: () => void) {
  const menuRoot = root.querySelector<HTMLElement>('[data-blogs-category-root]');
  const trigger = root.querySelector<HTMLButtonElement>('[data-blogs-category-trigger]');
  const menu = root.querySelector<HTMLElement>('[data-blogs-category-menu]');
  const label = root.querySelector<HTMLElement>('[data-blogs-category-label]');
  const input = root.querySelector<HTMLInputElement>('[data-blogs-category]');
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

function initBlogsListing() {
  const root = document.querySelector('[data-blogs-listing]');
  if (!(root instanceof HTMLElement) || root.dataset.blogsError === 'true') return;

  const grid = root.querySelector<HTMLElement>('[data-blogs-grid]');
  const empty = root.querySelector<HTMLElement>('[data-blogs-empty]');
  const loading = root.querySelector<HTMLElement>('[data-blogs-loading]');
  const sentinel = root.querySelector<HTMLElement>('[data-blogs-sentinel]');
  if (!grid || !sentinel) return;

  let page = Number(root.dataset.blogsPage || '1');
  let total = Number(root.dataset.blogsTotal || '0');
  const perPage = Number(root.dataset.blogsPerPage || '10');
  let query = '';
  let category = '';
  let pending = false;
  let done = page * perPage >= total;
  let requestId = 0;
  let searchTimer = 0;

  const cards = () => [...grid.querySelectorAll<HTMLElement>('[data-blog-card]')];

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

  const appendBlogs = (items: BlogCard[]) => {
    const seen = new Set(cards().map((card) => card.querySelector('a')?.getAttribute('href')));
    items.forEach((blog) => {
      const href = `/blogs/${blog.slug}`;
      if (seen.has(href)) return;
      seen.add(href);
      grid.append(renderCard(blog));
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
      const response = await fetch(`/api/v1/public/blogs?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('blog page failed');
      const data = (await response.json()) as BlogPage;
      if (id !== requestId) return;
      const items = Array.isArray(data.items) ? data.items : [];
      if (replace) grid.replaceChildren();
      appendBlogs(items);
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

  if (sentinel && 'IntersectionObserver' in window) {
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

initBlogsListing();
