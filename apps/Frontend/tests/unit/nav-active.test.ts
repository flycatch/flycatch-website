import { describe, expect, it } from 'vitest';
import { currentNavHref, isCurrentNavHref, isNavSectionActive } from '../../src/lib/nav';

describe('header active route', () => {
  it('highlights the longest matching menu href, including nested routes', () => {
    expect(currentNavHref('/services/cloud-migration')).toBe('/services/cloud-migration');
    expect(currentNavHref('/services/cloud-migration/')).toBe('/services/cloud-migration');
    expect(currentNavHref('/case-studies/sample')).toBe('/case-studies');
    expect(currentNavHref('/company/jobs-openings/engineer')).toBe('/company/jobs-openings');
    expect(currentNavHref('/solutions/credit-life')).toBe('/solutions');
    expect(currentNavHref('/')).toBeNull();
    expect(isCurrentNavHref('/services/ai-services', '/services/ai-services')).toBe(true);
    expect(isCurrentNavHref('/services/ai-services', '/services')).toBe(false);
  });

  it('keeps parent menus active for nested pages without marking unrelated sections', () => {
    expect(isNavSectionActive('/services/data-migration', '/services')).toBe(true);
    expect(isNavSectionActive('/services', '/services')).toBe(true);
    expect(isNavSectionActive('/company/about-us', '/company')).toBe(true);
    expect(isNavSectionActive('/contact-us', '/services')).toBe(false);
    expect(isNavSectionActive('/contact-us', '/company')).toBe(false);
    expect(isCurrentNavHref('/contact-us', '/contact-us')).toBe(true);
  });
});
