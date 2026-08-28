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
    expect(parseAdminLocation('/admin/solutions/').view).toBe('solutions');
    expect(parseAdminLocation('/admin/solution-details/').view).toBe('solution_details');
    expect(parseAdminLocation('/admin/solution-products/').view).toBe('solution_products');
    expect(parseAdminLocation('/admin/ai-services/').view).toBe('ai_services');
    expect(parseAdminLocation('/admin/cloud-services/').view).toBe('cloud_services');
    expect(parseAdminLocation('/admin/data-analytics/').view).toBe('data_analytics');
    expect(parseAdminLocation('/admin/digital-transformation/').view).toBe(
      'digital_transformation',
    );
    expect(parseAdminLocation('/admin/devops-consult/').view).toBe('devops_consult');
    expect(parseAdminLocation('/admin/infrastructure-management/').view).toBe(
      'infrastructure_management',
    );
    expect(parseAdminLocation('/admin/application-development/').view).toBe(
      'application_development',
    );
    expect(parseAdminLocation('/admin/application-modernization/').view).toBe(
      'application_modernization',
    );
    expect(parseAdminLocation('/admin/mobile-application-development/').view).toBe(
      'mobile_application_development',
    );
    expect(parseAdminLocation('/admin/user-centered-design/').view).toBe('user_centered_design');
    expect(parseAdminLocation('/admin/overview/').view).toBe('overview');
    expect(parseAdminLocation('/admin/home/', '?new=1').view).toBe('home_form');
    expect(parseAdminLocation('/admin/home/', '?id=abc')).toEqual({
      view: 'home_form',
      editingId: 'abc',
      href: '/admin/home/?id=abc',
    });
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
    expect(adminListHref('solutions')).toBe('/admin/solutions/');
    expect(adminListHref('solution_details')).toBe('/admin/solution-details/');
    expect(adminListHref('solution_products')).toBe('/admin/solution-products/');
    expect(adminListHref('ai_services')).toBe('/admin/ai-services/');
    expect(adminListHref('cloud_services')).toBe('/admin/cloud-services/');
    expect(adminListHref('data_analytics')).toBe('/admin/data-analytics/');
    expect(adminListHref('digital_transformation')).toBe('/admin/digital-transformation/');
    expect(adminListHref('devops_consult')).toBe('/admin/devops-consult/');
    expect(adminListHref('infrastructure_management')).toBe('/admin/infrastructure-management/');
    expect(adminListHref('application_development')).toBe('/admin/application-development/');
    expect(adminListHref('application_modernization')).toBe('/admin/application-modernization/');
    expect(adminListHref('mobile_application_development')).toBe(
      '/admin/mobile-application-development/',
    );
    expect(adminListHref('user_centered_design')).toBe('/admin/user-centered-design/');
    expect(adminListHref('overview')).toBe('/admin/overview/');
    expect(adminFormHref('blogs', null)).toBe('/admin/blogs/?new=1');
    expect(adminFormHref('blogs', 'post-1')).toBe('/admin/blogs/?id=post-1');
  });
});
