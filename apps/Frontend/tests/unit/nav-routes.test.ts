import { describe, expect, it } from 'vitest';
import {
  caseStudiesIndexHref,
  companyLinks,
  companyMenuColumns,
  contactHref,
  footerCompany,
  footerGlobal,
  footerLegal,
  footerOthers,
  footerServices,
  isImplementedPublicHref,
  mobileApplicationLinks,
  mobileCompanyLinks,
  mobileDevopsLinks,
  mobileServiceLeaves,
  productionDeadServicePaths,
  serviceFlyoutApplication,
  serviceFlyoutColumnFour,
  serviceFlyoutDevops,
  serviceGroups,
  serviceSingles,
  servicesOverview,
  socialLinks,
  solutionLinks,
  solutionsIndexHref,
} from '../../src/lib/nav';

function flattenNavHrefs(): string[] {
  return [
    servicesOverview?.href,
    caseStudiesIndexHref,
    contactHref,
    solutionsIndexHref,
    ...serviceSingles.map((link) => link.href),
    ...serviceGroups.flatMap((group) => group.links.map((link) => link.href)),
    ...serviceFlyoutApplication.links.map((link) => link.href),
    ...serviceFlyoutDevops.map((link) => link.href),
    ...serviceFlyoutColumnFour.map((link) => link.href),
    ...solutionLinks.map((link) => link.href),
    ...companyLinks.map((link) => link.href),
    ...companyMenuColumns.flatMap((column) => column.map((link) => link.href)),
    ...mobileCompanyLinks.map((link) => link.href),
    ...mobileApplicationLinks.map((link) => link.href),
    ...mobileDevopsLinks.map((link) => link.href),
    ...mobileServiceLeaves.map((link) => link.href),
    ...footerCompany.map((link) => link.href),
    ...footerServices.map((link) => link.href),
    ...footerOthers.map((link) => link.href),
    ...footerGlobal.map((link) => link.href),
    ...footerLegal.map((link) => link.href),
    ...socialLinks.map((link) => link.href),
  ].filter((href): href is string => Boolean(href));
}

describe('nav and footer routes', () => {
  it('emits only implemented or external hrefs', () => {
    for (const href of flattenNavHrefs()) {
      expect(isImplementedPublicHref(href), href).toBe(true);
    }
  });

  it('does not reintroduce production dead service menu entries', () => {
    const hrefs = new Set(flattenNavHrefs());
    for (const dead of productionDeadServicePaths) {
      expect(hrefs.has(dead)).toBe(false);
      expect(isImplementedPublicHref(dead)).toBe(false);
    }
  });
});
