import { describe, expect, it } from 'vitest';
import { CATALOG_SECTIONS, catalogByView } from '../../src/lib/catalog-sections';

describe('CATALOG_SECTIONS', () => {
  it('registers ten administration resources', () => {
    expect(CATALOG_SECTIONS.map((section) => section.resource)).toEqual([
      'applications',
      'openings',
      'employee_testimonials',
      'email_configuration',
      'email_templates',
      'news_categories',
      'news',
      'resource_categories',
      'resources',
      'memberships',
    ]);
  });

  it('maps list and form views', () => {
    expect(catalogByView('news')?.path).toBe('/admin/news');
    expect(catalogByView('membership_form')?.resource).toBe('memberships');
  });

  it('hides openings on applications and shows resume file format', () => {
    const applications = catalogByView('applications');
    expect(applications?.columns.map((column) => column.key)).toEqual(['resume_format', 'name', 'state']);
    expect(applications?.columns[0].kind).toBe('format');
    const resume = applications?.fields.find((field) => field.kind === 'media' && field.key === 'resume_key');
    expect(resume?.kind).toBe('media');
    if (resume?.kind === 'media') {
      expect(resume.accept).toContain('image/jpeg');
      expect(resume.accept).toContain('application/pdf');
    }
  });

  it('auto-slug fields follow role or title', () => {
    expect(catalogByView('opening_form')?.fields).toEqual(
      expect.arrayContaining([{ kind: 'slug', key: 'slug', labelKey: 'slug', fromKey: 'role', required: true }]),
    );
    expect(catalogByView('news_form')?.fields).toEqual(
      expect.arrayContaining([{ kind: 'slug', key: 'slug', labelKey: 'slug', fromKey: 'title', required: true }]),
    );
    expect(catalogByView('resource_form')?.fields).toEqual(
      expect.arrayContaining([{ kind: 'slug', key: 'slug', labelKey: 'slug', fromKey: 'title', required: true }]),
    );
  });
});
