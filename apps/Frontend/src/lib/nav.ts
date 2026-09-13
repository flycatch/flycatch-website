export type NavLink = {
  href: string;
  labelKey: string;
};

export type NavGroup = {
  headingKey: string;
  links: NavLink[];
};

/** Routes that currently have an Astro page. Expand as missing templates land. */
export const implementedPublicPaths = new Set<string>([
  '/',
  '/services',
  '/services/ai-services',
  '/services/application-development-services',
  '/services/application-modernization',
  '/services/mobile-application-development',
  '/services/user-centered-design',
  '/services/devOps-consultation',
  '/services/infrastructure-management-and-automation',
  '/services/cloud-migration',
  '/services/data-migration',
  '/services/digital-transformation',
  '/solutions',
  '/solutions/credit-life',
  '/solutions/com-bus',
  '/solutions/procure-flex',
  '/solutions/ai-chat-support',
  '/solutions/flyGrid-ai',
  '/solutions/doctCare-ai',
  '/solutions/talkShop-ai',
  '/solutions/docSis-ai',
  '/case-studies',
  '/company/about-us',
  '/company/blogs',
  '/company/careers',
  '/company/jobs-openings',
  '/company/clients',
  '/company/testimonials',
  '/company/resources',
  '/company/memberships',
  '/company/news-and-events',
  '/contact-us',
  '/software-development-services-in-saudi-arabia',
  '/privacy-policy',
  '/terms-and-conditions',
]);

export const implementedPublicPrefixes = [
  '/company/blogs/',
  '/case-studies/',
  '/company/jobs-openings/',
  '/company/resources/',
  '/company/news-and-events/',
] as const;

/** Production advertises these; they 404 there and must stay out of this nav. */
export const productionDeadServicePaths = [
  '/services/cloud-consult',
  '/services/business-intelligence',
  '/services/big-data-analysis',
  '/services/agentic-ai',
  '/services/enterprise-gpt',
  '/services/conversational-ai',
  '/services/knowledge-ai',
] as const;

export function isImplementedPublicHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return true;
  if (trimmed.startsWith('#')) return true;
  const path = trimmed.split('#')[0]?.split('?')[0] ?? '';
  if (!path.startsWith('/')) return false;
  if (implementedPublicPaths.has(path)) return true;
  return implementedPublicPrefixes.some((prefix) => path.startsWith(prefix) && path.length > prefix.length);
}

export function implementedPublicHref(href: string): string | null {
  const trimmed = href.trim();
  return isImplementedPublicHref(trimmed) ? trimmed : null;
}

function liveLinks(links: NavLink[]): NavLink[] {
  return links.filter((link) => isImplementedPublicHref(link.href));
}

function liveGroups(groups: NavGroup[]): NavGroup[] {
  return groups
    .map((group) => ({ ...group, links: liveLinks(group.links) }))
    .filter((group) => group.links.length > 0);
}

const intendedServicesOverview: NavLink = { href: '/services', labelKey: 'nav.overview' };

export const servicesOverview: NavLink | null = isImplementedPublicHref(intendedServicesOverview.href)
  ? intendedServicesOverview
  : null;

export const serviceGroups: NavGroup[] = liveGroups([
  {
    headingKey: 'nav.application_services',
    links: [
      { href: '/services/application-development-services', labelKey: 'nav.application_development' },
      { href: '/services/application-modernization', labelKey: 'nav.application_modernization' },
      { href: '/services/mobile-application-development', labelKey: 'nav.mobile_application' },
      { href: '/services/user-centered-design', labelKey: 'nav.user_centered_design' },
    ],
  },
  {
    headingKey: 'nav.devops',
    links: [
      { href: '/services/devOps-consultation', labelKey: 'nav.devops_consult' },
      {
        href: '/services/infrastructure-management-and-automation',
        labelKey: 'nav.infra_management',
      },
    ],
  },
]);

export const serviceSingles: NavLink[] = liveLinks([
  { href: '/services/ai-services', labelKey: 'nav.ai_services' },
  { href: '/services/cloud-migration', labelKey: 'nav.cloud_services' },
  { href: '/services/data-migration', labelKey: 'nav.data_analytics' },
  { href: '/services/digital-transformation', labelKey: 'nav.digital_transformation' },
]);

export const serviceFlyoutApplication = serviceGroups[0] ?? { headingKey: 'nav.application_services', links: [] };

export const serviceFlyoutDevops: NavLink[] = liveLinks([
  { href: '/services/devOps-consultation', labelKey: 'nav.flyout_devops_consult' },
  {
    href: '/services/infrastructure-management-and-automation',
    labelKey: 'nav.flyout_infra',
  },
]);

export const serviceFlyoutColumnFour: NavLink[] = liveLinks([
  { href: '/services/ai-services', labelKey: 'nav.ai_services' },
  { href: '/services/cloud-migration', labelKey: 'nav.cloud_services_migrations' },
  { href: '/services/data-migration', labelKey: 'nav.data_analytics' },
  { href: '/services/digital-transformation', labelKey: 'nav.digital_transformation' },
]);

export const hasServiceFlyout =
  Boolean(servicesOverview) ||
  serviceFlyoutApplication.links.length > 0 ||
  serviceFlyoutDevops.length > 0 ||
  serviceFlyoutColumnFour.length > 0;

export const solutionLinks: NavLink[] = liveLinks([
  { href: '/solutions', labelKey: 'nav.solutions_overview' },
  { href: '/solutions/credit-life', labelKey: 'nav.credit_life' },
  { href: '/solutions/com-bus', labelKey: 'nav.combus' },
  { href: '/solutions/ai-chat-support', labelKey: 'nav.ai_chat_support' },
  { href: '/solutions/procure-flex', labelKey: 'nav.procureflex' },
  { href: '/solutions/flyGrid-ai', labelKey: 'nav.flygrid' },
  { href: '/solutions/doctCare-ai', labelKey: 'nav.doctcare' },
  { href: '/solutions/talkShop-ai', labelKey: 'nav.talkshop' },
  { href: '/solutions/docSis-ai', labelKey: 'nav.docsist' },
]);

export const solutionsIndexHref = implementedPublicHref('/solutions');
export const caseStudiesIndexHref = implementedPublicHref('/case-studies');
export const contactHref = implementedPublicHref('/contact-us');

export const companyLinks: NavLink[] = liveLinks([
  { href: '/company/about-us', labelKey: 'nav.about' },
  { href: '/company/careers', labelKey: 'nav.careers' },
  { href: '/company/clients', labelKey: 'nav.clients' },
  { href: '/company/testimonials', labelKey: 'nav.stories' },
  { href: '/company/blogs', labelKey: 'nav.blogs' },
]);

export const companyMenuColumns: NavLink[][] = [
  [
    { href: '/company/about-us', labelKey: 'nav.about_us' },
    { href: '/company/careers', labelKey: 'nav.careers' },
    { href: '/company/jobs-openings', labelKey: 'nav.job_openings' },
  ],
  [
    { href: '/company/resources', labelKey: 'nav.resources' },
    { href: '/company/clients', labelKey: 'nav.clients' },
    { href: '/company/testimonials', labelKey: 'nav.testimonials' },
    { href: '/company/blogs', labelKey: 'nav.blogs' },
  ],
]
  .map((links) => liveLinks(links))
  .filter((links) => links.length > 0);

export const mobileCompanyLinks = companyMenuColumns[0] ?? [];

export const mobileApplicationLinks: NavLink[] = liveLinks([
  { href: '/services/application-development-services', labelKey: 'nav.application_development_services' },
  { href: '/services/application-modernization', labelKey: 'nav.mobile_application_modernization' },
  { href: '/services/mobile-application-development', labelKey: 'nav.mobile_application_development' },
  { href: '/services/user-centered-design', labelKey: 'nav.mobile_user_centered_design' },
]);

export const mobileDevopsLinks: NavLink[] = liveLinks([
  { href: '/services/devOps-consultation', labelKey: 'nav.devops_consulting' },
  {
    href: '/services/infrastructure-management-and-automation',
    labelKey: 'nav.infra_management_full',
  },
]);

export const mobileServiceLeaves: NavLink[] = liveLinks([
  { href: '/services/ai-services', labelKey: 'nav.ai_services' },
  { href: '/services/cloud-migration', labelKey: 'nav.cloud_services' },
  { href: '/services/data-migration', labelKey: 'nav.data_analytics_migrations' },
  { href: '/services/digital-transformation', labelKey: 'nav.mobile_digital_transformation' },
]);

export const footerCompany: NavLink[] = liveLinks([
  { href: '/solutions', labelKey: 'nav.solutions' },
  { href: '/company/about-us', labelKey: 'nav.about' },
  { href: '/company/careers', labelKey: 'nav.careers' },
  { href: '/contact-us', labelKey: 'nav.contact' },
]);

export const footerServices: NavLink[] = liveLinks([
  { href: '/services/ai-services', labelKey: 'nav.ai_services' },
  { href: '/services/application-development-services', labelKey: 'nav.application_services' },
  { href: '/services/devOps-consultation', labelKey: 'nav.devops' },
  { href: '/services/cloud-migration', labelKey: 'nav.cloud_services' },
  { href: '/services/data-migration', labelKey: 'nav.data_analytics' },
]);

export const footerOthers: NavLink[] = liveLinks([
  { href: '/company/clients', labelKey: 'nav.clients' },
  { href: '/company/testimonials', labelKey: 'nav.stories' },
  { href: '/company/blogs', labelKey: 'nav.blogs' },
]);

export const footerGlobal: NavLink[] = liveLinks([
  { href: '/software-development-services-in-saudi-arabia', labelKey: 'footer.saudi' },
]);

export const footerLegal: NavLink[] = liveLinks([
  { href: '/privacy-policy', labelKey: 'footer.privacy' },
  { href: '/terms-and-conditions', labelKey: 'footer.terms' },
]);

export const socialLinks: NavLink[] = [
  { href: 'https://www.facebook.com/flycatchtech', labelKey: 'footer.facebook' },
  { href: 'https://www.linkedin.com/company/flycatch', labelKey: 'footer.linkedin' },
  { href: 'https://www.instagram.com/flycatchtech', labelKey: 'footer.instagram' },
];
