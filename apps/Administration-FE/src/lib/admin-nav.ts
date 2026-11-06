import { LANDING_SECTIONS } from './landing-sections';
import { CATALOG_SECTIONS } from './catalog-sections';
import type { AdminView } from './admin-routes';

export type NavItem = {
  /** List view the link opens; forms resolve to their list via adminListViewOf. */
  view: AdminView;
  /** RBAC resource whose `.read` permission gates the link. */
  resource: string;
  labelKey: string;
  /** Roles management is gated by `roles.manage` / administrator, not `.read`. */
  manageRoles?: boolean;
};

export type NavGroup = {
  id: string;
  labelKey: string;
  items: NavItem[];
};

function item(view: string, resource = view, labelKey?: string): NavItem {
  return { view: view as AdminView, resource, labelKey: labelKey ?? `admin.workspace.${resource}` };
}

const LANDING_RESOURCES = LANDING_SECTIONS.map((section) => section.resource);
const catalog = (resource: string) => {
  const section = CATALOG_SECTIONS.find((entry) => entry.resource === resource);
  if (!section) throw new Error(`Unknown catalog section: ${resource}`);
  return item(section.listView, section.resource);
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'site',
    labelKey: 'admin.nav.group.site',
    items: [
      item('site_settings', 'site_settings'),
      item('home', 'home', 'admin.workspace.home_page'),
      catalog('flycatch_saudi_arabia'),
    ],
  },
  {
    id: 'services',
    labelKey: 'admin.nav.group.services',
    items: [
      item('solutions'),
      item('solution_details'),
      item('solution_products'),
      item('ai_services'),
      item('cloud_services'),
      item('data_analytics'),
      item('digital_transformation'),
      ...LANDING_RESOURCES.map((resource) => item(resource)),
    ],
  },
  {
    id: 'content',
    labelKey: 'admin.nav.group.content',
    items: [
      item('blogs'),
      item('authors'),
      item('categories', 'categories', 'admin.nav.blog_categories'),
      item('case_studies'),
      item('industries'),
      item('technologies'),
      item('case_study_categories'),
      catalog('news'),
      catalog('news_categories'),
      catalog('resources'),
      catalog('resource_categories'),
      catalog('downloads'),
    ],
  },
  {
    id: 'social_proof',
    labelKey: 'admin.nav.group.social_proof',
    items: [
      item('client_logos'),
      item('client_testimonials'),
      catalog('employee_testimonials'),
    ],
  },
  {
    id: 'inbox',
    labelKey: 'admin.nav.group.inbox',
    items: [catalog('contacts'), catalog('subscriptions'), catalog('memberships')],
  },
  {
    id: 'settings',
    labelKey: 'admin.nav.group.settings',
    items: [
      catalog('email_configuration'),
      catalog('email_templates'),
      {
        view: 'roles',
        resource: 'roles',
        labelKey: 'admin.nav.roles',
        manageRoles: true,
      },
    ],
  },
];

export function navGroupForView(listView: AdminView): NavGroup | undefined {
  return NAV_GROUPS.find((group) => group.items.some((entry) => entry.view === listView));
}

export function navLabelKeyForView(listView: AdminView): string | undefined {
  for (const group of NAV_GROUPS) {
    const found = group.items.find((entry) => entry.view === listView);
    if (found) return found.labelKey;
  }
  return undefined;
}
