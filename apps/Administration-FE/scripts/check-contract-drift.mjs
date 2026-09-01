#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = join(root, 'src/generated');
const required = [
  'admin-auth.v2.ts',
  'admin-rbac.v1.ts',
  'admin-management.v2.ts',
  'admin-roles.v1.ts',
  'publish.v2.ts',
  'admin-blogs.v1.ts',
  'admin-case-studies.v1.ts',
  'admin-client-logos.v1.ts',
  'admin-client-testimonials.v1.ts',
  'admin-homes.v1.ts',
  'admin-solutions.v1.ts',
  'admin-solution-details.v1.ts',
  'admin-solution-products.v1.ts',
  'admin-ai-services.v1.ts',
  'admin-cloud-services.v1.ts',
  'admin-data-analytics.v1.ts',
  'admin-digital-transformation.v1.ts',
  'admin-devops-consult.v1.ts',
  'admin-infrastructure-management.v1.ts',
  'admin-application-development.v1.ts',
  'admin-application-modernization.v1.ts',
  'admin-mobile-application-development.v1.ts',
  'admin-user-centered-design.v1.ts',
  'admin-overview.v1.ts',
  'admin-applications.v1.ts',
  'admin-openings.v1.ts',
  'admin-employee-testimonials.v1.ts',
  'admin-email-configuration.v1.ts',
  'admin-email-templates.v1.ts',
  'admin-news-categories.v1.ts',
  'admin-news.v1.ts',
  'admin-resource-categories.v1.ts',
  'admin-resources.v1.ts',
  'admin-memberships.v1.ts',
  'admin-contacts.v1.ts',
  'admin-downloads.v1.ts',
  'admin-flycatch-saudi-arabia.v1.ts',
  'admin-subscriptions.v1.ts',
];

let failed = false;
for (const file of required) {
  const full = join(generatedDir, file);
  if (!existsSync(full)) {
    console.error(`Missing generated contract file: ${file}. Run npm run generate:client`);
    failed = true;
  }
}

const api = readFileSync(join(root, 'src/lib/admin-api.ts'), 'utf8');
const forbidden = [
  /export (type|interface) TokenPair\s*\{/,
  /export (type|interface) SessionContext\s*\{/,
  /export (type|interface) PermissionName\s*=\s*['"]/,
  /export (type|interface) PermissionDenied\s*\{/,
];
for (const pattern of forbidden) {
  if (pattern.test(api)) {
    console.error(`Hand-written token/permission DTO detected in admin-api.ts: ${pattern}`);
    failed = true;
  }
}

if (!api.includes('../generated/admin-auth.v2') || !api.includes('../generated/admin-rbac.v1')) {
  console.error('admin-api.ts must import token/permission types from generated 002 contracts');
  failed = true;
}

if (failed) process.exit(1);
console.log('Administration FE contract drift check passed');
