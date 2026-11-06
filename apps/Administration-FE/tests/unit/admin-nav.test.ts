import { describe, expect, it } from 'vitest';
import { NAV_GROUPS, navGroupForView } from '../../src/lib/admin-nav';
import { adminListHref, adminListViewOf, parseAdminLocation } from '../../src/lib/admin-routes';
import { CATALOG_SECTIONS } from '../../src/lib/catalog-sections';
import { LANDING_SECTIONS } from '../../src/lib/landing-sections';
import { t } from '../../src/lib/i18n';

const items = NAV_GROUPS.flatMap((group) => group.items);

describe('admin nav groups', () => {
  it('has no duplicate entries', () => {
    const views = items.map((entry) => entry.view);
    expect(new Set(views).size).toBe(views.length);
  });

  it('links every item to a routable list view', () => {
    for (const entry of items) {
      const href = adminListHref(entry.view);
      expect(parseAdminLocation(href).view, entry.view).toBe(entry.view);
      expect(adminListViewOf(entry.view)).toBe(entry.view);
    }
  });

  it('includes every catalog and landing section', () => {
    const views = new Set(items.map((entry) => entry.view as string));
    for (const section of [...CATALOG_SECTIONS, ...LANDING_SECTIONS]) {
      expect(views.has(section.listView), section.resource).toBe(true);
    }
  });

  it('has labels for items and groups', () => {
    for (const entry of items) expect(t(entry.labelKey)).not.toBe(entry.labelKey);
    for (const group of NAV_GROUPS) expect(t(group.labelKey)).not.toBe(group.labelKey);
  });

  it('finds the group of a list view', () => {
    expect(navGroupForView('blogs')?.id).toBe('content');
    expect(navGroupForView('roles')?.id).toBe('settings');
  });
});
