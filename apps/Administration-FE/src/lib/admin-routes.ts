export type AdminView =
  | 'site_settings'
  | 'home'
  | 'blogs'
  | 'blog_form'
  | 'case_studies'
  | 'case_study_form'
  | 'industries'
  | 'industry_form'
  | 'case_study_categories'
  | 'case_study_category_form'
  | 'technologies'
  | 'technology_form'
  | 'authors'
  | 'author_form'
  | 'categories'
  | 'category_form'
  | 'client_logos'
  | 'client_logo_form'
  | 'client_testimonials'
  | 'client_testimonial_form'
  | 'roles'
  | 'role_form';

export type AdminRoute = {
  view: AdminView;
  editingId: string | null;
  href: string;
};

type SectionConfig = {
  segment: string;
  list: AdminView;
  form: AdminView;
};

const SECTIONS: SectionConfig[] = [
  { segment: 'home', list: 'home', form: 'home' },
  { segment: 'blogs', list: 'blogs', form: 'blog_form' },
  { segment: 'case-studies', list: 'case_studies', form: 'case_study_form' },
  { segment: 'industries', list: 'industries', form: 'industry_form' },
  { segment: 'case-study-categories', list: 'case_study_categories', form: 'case_study_category_form' },
  { segment: 'technologies', list: 'technologies', form: 'technology_form' },
  { segment: 'authors', list: 'authors', form: 'author_form' },
  { segment: 'categories', list: 'categories', form: 'category_form' },
  { segment: 'client-logos', list: 'client_logos', form: 'client_logo_form' },
  { segment: 'client-testimonials', list: 'client_testimonials', form: 'client_testimonial_form' },
  { segment: 'roles', list: 'roles', form: 'role_form' },
  { segment: 'settings', list: 'roles', form: 'role_form' },
];

const LIST_HREF: Record<string, string> = {
  site_settings: '/admin/',
  home: '/admin/home/',
  blogs: '/admin/blogs/',
  case_studies: '/admin/case-studies/',
  industries: '/admin/industries/',
  case_study_categories: '/admin/case-study-categories/',
  technologies: '/admin/technologies/',
  authors: '/admin/authors/',
  categories: '/admin/categories/',
  client_logos: '/admin/client-logos/',
  client_testimonials: '/admin/client-testimonials/',
  roles: '/admin/roles/',
};

function sectionForList(view: AdminView): SectionConfig | undefined {
  return SECTIONS.find((section) => section.list === view || section.form === view);
}

export function adminListHref(view: AdminView): string {
  const listView = sectionForList(view)?.list ?? view;
  return LIST_HREF[listView] ?? '/admin/';
}

export function adminFormHref(listView: AdminView, editingId: string | null): string {
  const base = adminListHref(listView);
  if (editingId) {
    return `${base}?id=${encodeURIComponent(editingId)}`;
  }
  return `${base}?new=1`;
}

function pathSegments(pathname: string): string[] {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'admin') {
    parts.shift();
  }
  if (parts[0] === 'admin') {
    parts.shift();
  }
  if (parts[0] === 'sign-in') {
    return [];
  }
  return parts;
}

export function parseAdminLocation(pathname: string, search = ''): AdminRoute {
  const segments = pathSegments(pathname);
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const queryId = params.get('id');
  const isNew = params.has('new');

  if (segments.length === 0) {
    return { view: 'site_settings', editingId: null, href: '/admin/' };
  }

  const section = SECTIONS.find((item) => item.segment === segments[0]);
  if (!section) {
    return { view: 'site_settings', editingId: null, href: '/admin/' };
  }

  const rest = segments[1];
  const editingId = rest && rest !== 'new' ? rest : queryId;
  const showForm =
    section.form !== section.list && (rest === 'new' || Boolean(editingId) || isNew);

  if (showForm) {
    return {
      view: section.form,
      editingId: editingId && rest !== 'new' ? editingId : queryId,
      href: adminFormHref(section.list, editingId && rest !== 'new' ? editingId : queryId),
    };
  }

  return {
    view: section.list,
    editingId: null,
    href: adminListHref(section.list),
  };
}

export function readAdminLocation(): AdminRoute {
  if (typeof window === 'undefined') {
    return { view: 'site_settings', editingId: null, href: '/admin/' };
  }
  return parseAdminLocation(window.location.pathname, window.location.search);
}

export function sameAdminRoute(a: AdminRoute, b: AdminRoute): boolean {
  return a.view === b.view && a.editingId === b.editingId;
}
