import { describe, expect, it } from 'vitest';
import { adminFormHref, adminListHref, parseAdminLocation } from '../../src/lib/admin-routes';

describe('parseAdminLocation', () => {
  it('maps the admin root to site settings', () => {
    expect(parseAdminLocation('/admin/')).toEqual({
      view: 'site_settings',
      editingId: null,
      href: '/admin/',
    });
  });

  it('maps section paths used in the workspace nav', () => {
    expect(parseAdminLocation('/admin/blogs/').view).toBe('blogs');
    expect(parseAdminLocation('/admin/case-studies/').view).toBe('case_studies');
    expect(parseAdminLocation('/admin/industries/').view).toBe('industries');
    expect(parseAdminLocation('/admin/case-study-categories/').view).toBe('case_study_categories');
    expect(parseAdminLocation('/admin/technologies/').view).toBe('technologies');
    expect(parseAdminLocation('/admin/authors/').view).toBe('authors');
    expect(parseAdminLocation('/admin/categories/').view).toBe('categories');
    expect(parseAdminLocation('/admin/client-logos/').view).toBe('client_logos');
    expect(parseAdminLocation('/admin/client-testimonials/').view).toBe('client_testimonials');
    expect(parseAdminLocation('/admin/home/').view).toBe('home');
    expect(parseAdminLocation('/admin/roles/').view).toBe('roles');
  });

  it('opens forms from query params so refresh keeps the editor', () => {
    expect(parseAdminLocation('/admin/blogs/', '?new=1')).toEqual({
      view: 'blog_form',
      editingId: null,
      href: '/admin/blogs/?new=1',
    });
    expect(parseAdminLocation('/admin/case-studies/', '?id=abc')).toEqual({
      view: 'case_study_form',
      editingId: 'abc',
      href: '/admin/case-studies/?id=abc',
    });
  });

  it('tolerates an extra /admin prefix from Astro base + pages/admin', () => {
    expect(parseAdminLocation('/admin/admin/blogs/').view).toBe('blogs');
  });
});

describe('admin href helpers', () => {
  it('builds list and form hrefs', () => {
    expect(adminListHref('blogs')).toBe('/admin/blogs/');
    expect(adminListHref('authors')).toBe('/admin/authors/');
    expect(adminListHref('categories')).toBe('/admin/categories/');
    expect(adminListHref('industries')).toBe('/admin/industries/');
    expect(adminListHref('case_study_categories')).toBe('/admin/case-study-categories/');
    expect(adminListHref('technologies')).toBe('/admin/technologies/');
    expect(adminListHref('client_logos')).toBe('/admin/client-logos/');
    expect(adminListHref('client_testimonials')).toBe('/admin/client-testimonials/');
    expect(adminFormHref('blogs', null)).toBe('/admin/blogs/?new=1');
    expect(adminFormHref('blogs', 'post-1')).toBe('/admin/blogs/?id=post-1');
  });
});
