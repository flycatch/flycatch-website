#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');
const outDir = join(here, '../src/generated');
const authContractsDir =
  process.env.CONTRACTS_DIR || join(repoRoot, 'specs/002-auth-rbac/contracts');
const blogsContractsDir = join(repoRoot, 'specs/004-admin-blogs/contracts');
const caseStudiesContractsDir = join(repoRoot, 'specs/005-admin-case-studies/contracts');
const clientLogosContractsDir = join(repoRoot, 'specs/006-admin-client-logos/contracts');
const clientTestimonialsContractsDir = join(
  repoRoot,
  'specs/007-admin-client-testimonials/contracts',
);
const homesContractsDir = join(repoRoot, 'specs/008-admin-home/contracts');
const solutionsContractsDir = join(repoRoot, 'specs/009-admin-solutions/contracts');
const solutionDetailsContractsDir = join(repoRoot, 'specs/010-admin-solution-details/contracts');
const solutionProductsContractsDir = join(
  repoRoot,
  'specs/011-admin-solution-products/contracts',
);
const aiServicesContractsDir = join(repoRoot, 'specs/012-admin-ai-services/contracts');
const cloudServicesContractsDir = join(repoRoot, 'specs/013-admin-cloud-services/contracts');
const dataAnalyticsContractsDir = join(repoRoot, 'specs/014-admin-data-analytics/contracts');
const digitalTransformationContractsDir = join(
  repoRoot,
  'specs/015-admin-digital-transformation/contracts',
);
const devopsConsultContractsDir = join(repoRoot, 'specs/016-admin-devops-consult/contracts');
const infrastructureManagementContractsDir = join(
  repoRoot,
  'specs/017-admin-infrastructure-management/contracts',
);
const applicationDevelopmentContractsDir = join(
  repoRoot,
  'specs/018-admin-application-development/contracts',
);
const applicationModernizationContractsDir = join(
  repoRoot,
  'specs/019-admin-application-modernization/contracts',
);
const mobileApplicationDevelopmentContractsDir = join(
  repoRoot,
  'specs/020-admin-mobile-application-development/contracts',
);
const userCenteredDesignContractsDir = join(
  repoRoot,
  'specs/021-admin-user-centered-design/contracts',
);
const overviewContractsDir = join(repoRoot, 'specs/022-admin-overview/contracts');
const applicationsContractsDir = join(repoRoot, 'specs/023-admin-applications/contracts');
const openingsContractsDir = join(repoRoot, 'specs/024-admin-openings/contracts');
const employeeTestimonialsContractsDir = join(
  repoRoot,
  'specs/025-admin-employee-testimonials/contracts',
);
const emailConfigurationContractsDir = join(
  repoRoot,
  'specs/026-admin-email-configuration/contracts',
);
const emailTemplatesContractsDir = join(repoRoot, 'specs/027-admin-email-templates/contracts');
const newsCategoriesContractsDir = join(repoRoot, 'specs/028-admin-news-categories/contracts');
const newsContractsDir = join(repoRoot, 'specs/029-admin-news/contracts');
const resourceCategoriesContractsDir = join(
  repoRoot,
  'specs/030-admin-resource-categories/contracts',
);
const resourcesContractsDir = join(repoRoot, 'specs/031-admin-resources/contracts');
const membershipsContractsDir = join(repoRoot, 'specs/032-admin-memberships/contracts');
const contactsContractsDir = join(repoRoot, 'specs/033-admin-contacts/contracts');
const downloadsContractsDir = join(repoRoot, 'specs/034-admin-downloads/contracts');
const flycatchSaudiArabiaContractsDir = join(
  repoRoot,
  'specs/035-admin-flycatch-saudi-arabia/contracts',
);
const subscriptionsContractsDir = join(repoRoot, 'specs/036-admin-subscriptions/contracts');

const contractSets = [
  {
    dir: authContractsDir,
    files: [
      'admin-auth.v2.yaml',
      'admin-rbac.v1.yaml',
      'admin-management.v2.yaml',
      'admin-roles.v1.yaml',
      'publish.v2.yaml',
    ],
  },
  {
    dir: blogsContractsDir,
    files: ['admin-blogs.v1.yaml'],
  },
  {
    dir: caseStudiesContractsDir,
    files: ['admin-case-studies.v1.yaml'],
  },
  {
    dir: clientLogosContractsDir,
    files: ['admin-client-logos.v1.yaml'],
  },
  {
    dir: clientTestimonialsContractsDir,
    files: ['admin-client-testimonials.v1.yaml'],
  },
  {
    dir: homesContractsDir,
    files: ['admin-homes.v1.yaml'],
  },
  {
    dir: solutionsContractsDir,
    files: ['admin-solutions.v1.yaml'],
  },
  {
    dir: solutionDetailsContractsDir,
    files: ['admin-solution-details.v1.yaml'],
  },
  {
    dir: solutionProductsContractsDir,
    files: ['admin-solution-products.v1.yaml'],
  },
  {
    dir: aiServicesContractsDir,
    files: ['admin-ai-services.v1.yaml'],
  },
  {
    dir: cloudServicesContractsDir,
    files: ['admin-cloud-services.v1.yaml'],
  },
  {
    dir: dataAnalyticsContractsDir,
    files: ['admin-data-analytics.v1.yaml'],
  },
  {
    dir: digitalTransformationContractsDir,
    files: ['admin-digital-transformation.v1.yaml'],
  },
  {
    dir: devopsConsultContractsDir,
    files: ['admin-devops-consult.v1.yaml'],
  },
  {
    dir: infrastructureManagementContractsDir,
    files: ['admin-infrastructure-management.v1.yaml'],
  },
  {
    dir: applicationDevelopmentContractsDir,
    files: ['admin-application-development.v1.yaml'],
  },
  {
    dir: applicationModernizationContractsDir,
    files: ['admin-application-modernization.v1.yaml'],
  },
  {
    dir: mobileApplicationDevelopmentContractsDir,
    files: ['admin-mobile-application-development.v1.yaml'],
  },
  {
    dir: userCenteredDesignContractsDir,
    files: ['admin-user-centered-design.v1.yaml'],
  },
  {
    dir: overviewContractsDir,
    files: ['admin-overview.v1.yaml'],
  },
  { dir: applicationsContractsDir, files: ['admin-applications.v1.yaml'] },
  { dir: openingsContractsDir, files: ['admin-openings.v1.yaml'] },
  { dir: employeeTestimonialsContractsDir, files: ['admin-employee-testimonials.v1.yaml'] },
  { dir: emailConfigurationContractsDir, files: ['admin-email-configuration.v1.yaml'] },
  { dir: emailTemplatesContractsDir, files: ['admin-email-templates.v1.yaml'] },
  { dir: newsCategoriesContractsDir, files: ['admin-news-categories.v1.yaml'] },
  { dir: newsContractsDir, files: ['admin-news.v1.yaml'] },
  { dir: resourceCategoriesContractsDir, files: ['admin-resource-categories.v1.yaml'] },
  { dir: resourcesContractsDir, files: ['admin-resources.v1.yaml'] },
  { dir: membershipsContractsDir, files: ['admin-memberships.v1.yaml'] },
  { dir: contactsContractsDir, files: ['admin-contacts.v1.yaml'] },
  { dir: downloadsContractsDir, files: ['admin-downloads.v1.yaml'] },
  { dir: flycatchSaudiArabiaContractsDir, files: ['admin-flycatch-saudi-arabia.v1.yaml'] },
  { dir: subscriptionsContractsDir, files: ['admin-subscriptions.v1.yaml'] },
];

mkdirSync(outDir, { recursive: true });

for (const set of contractSets) {
  for (const file of set.files) {
    const src = join(set.dir, file);
    const dest = join(outDir, file.replace(/\.yaml$/, '.ts'));
    execFileSync('npx', ['openapi-typescript', src, '-o', dest], {
      stdio: 'inherit',
      cwd: join(here, '..'),
    });
  }
}

console.log('Generated Administration FE types from OpenAPI contracts');
