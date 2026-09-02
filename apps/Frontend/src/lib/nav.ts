export type NavLink = {
  href: string;
  labelKey: string;
};

export type NavGroup = {
  headingKey: string;
  links: NavLink[];
};

export const servicesOverview: NavLink = { href: '/services', labelKey: 'nav.overview' };

export const serviceGroups: NavGroup[] = [
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
];

export const serviceSingles: NavLink[] = [
  { href: '/services/ai-services', labelKey: 'nav.ai_services' },
  { href: '/services/cloud-migration', labelKey: 'nav.cloud_services' },
  { href: '/services/data-migration', labelKey: 'nav.data_analytics' },
  { href: '/services/digital-transformation', labelKey: 'nav.digital_transformation' },
];

export const solutionLinks: NavLink[] = [
  { href: '/solutions', labelKey: 'nav.solutions_overview' },
  { href: '/solutions/credit-life', labelKey: 'nav.credit_life' },
  { href: '/solutions/combus', labelKey: 'nav.combus' },
  { href: '/solutions/ai-chat-support', labelKey: 'nav.ai_chat_support' },
  { href: '/solutions/procureflex', labelKey: 'nav.procureflex' },
  { href: '/solutions/flygrid-ai', labelKey: 'nav.flygrid' },
  { href: '/solutions/doctcare-ai', labelKey: 'nav.doctcare' },
  { href: '/solutions/talkshop-ai', labelKey: 'nav.talkshop' },
  { href: '/solutions/docsist-ai', labelKey: 'nav.docsist' },
];

export const companyLinks: NavLink[] = [
  { href: '/about', labelKey: 'nav.about' },
  { href: '/company/careers', labelKey: 'nav.careers' },
  { href: '/company/clients', labelKey: 'nav.clients' },
  { href: '/company/testimonials', labelKey: 'nav.stories' },
  { href: '/company/blogs', labelKey: 'nav.blogs' },
];

export const footerCompany: NavLink[] = [
  { href: '/solutions', labelKey: 'nav.solutions' },
  { href: '/about', labelKey: 'nav.about' },
  { href: '/company/careers', labelKey: 'nav.careers' },
  { href: '/contact-us', labelKey: 'nav.contact' },
];

export const footerServices: NavLink[] = [
  { href: '/services/application-development-services', labelKey: 'nav.application_services' },
  { href: '/services/devOps-consultation', labelKey: 'nav.devops' },
  { href: '/services/cloud-migration', labelKey: 'nav.cloud_services' },
  { href: '/services/data-migration', labelKey: 'nav.data_analytics' },
];

export const footerOthers: NavLink[] = [
  { href: '/company/clients', labelKey: 'nav.clients' },
  { href: '/company/testimonials', labelKey: 'nav.stories' },
  { href: '/company/blogs', labelKey: 'nav.resources' },
];

export const socialLinks: NavLink[] = [
  { href: 'https://www.facebook.com/flycatchtech', labelKey: 'footer.facebook' },
  { href: 'https://www.linkedin.com/company/flycatch', labelKey: 'footer.linkedin' },
  { href: 'https://www.instagram.com/flycatchtech', labelKey: 'footer.instagram' },
];
