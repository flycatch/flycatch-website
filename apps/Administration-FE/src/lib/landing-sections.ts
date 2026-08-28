export type LandingListColumn = 'introduction_title' | 'introduction_first' | 'seo' | 'locale';

export type LandingSection = {
  id: string;
  resource: string;
  segment: string;
  listView: string;
  formView: string;
  ns: string;
  path: string;
  hasThirdIntro: boolean;
  hasAccordion: boolean;
  accordionKey: 'accordion' | 'experience_accordion';
  hasExperience: boolean;
  hasOffering: boolean;
  hasFaq: boolean;
  listColumns: LandingListColumn[];
};

export const LANDING_SECTIONS: LandingSection[] = [
  {
    id: 'devops_consult',
    resource: 'devops_consult',
    segment: 'devops-consult',
    listView: 'devops_consult',
    formView: 'devops_consult_form',
    ns: 'admin.devops_consult',
    path: '/admin/devops-consult',
    hasThirdIntro: false,
    hasAccordion: false,
    accordionKey: 'experience_accordion',
    hasExperience: true,
    hasOffering: false,
    hasFaq: true,
    listColumns: ['introduction_title'],
  },
  {
    id: 'infrastructure_management',
    resource: 'infrastructure_management',
    segment: 'infrastructure-management',
    listView: 'infrastructure_management',
    formView: 'infrastructure_management_form',
    ns: 'admin.infrastructure_management',
    path: '/admin/infrastructure-management',
    hasThirdIntro: false,
    hasAccordion: false,
    accordionKey: 'accordion',
    hasExperience: false,
    hasOffering: false,
    hasFaq: true,
    listColumns: ['introduction_title'],
  },
  {
    id: 'application_development',
    resource: 'application_development',
    segment: 'application-development',
    listView: 'application_development',
    formView: 'application_development_form',
    ns: 'admin.application_development',
    path: '/admin/application-development',
    hasThirdIntro: false,
    hasAccordion: true,
    accordionKey: 'accordion',
    hasExperience: false,
    hasOffering: true,
    hasFaq: true,
    listColumns: ['introduction_first', 'locale'],
  },
  {
    id: 'application_modernization',
    resource: 'application_modernization',
    segment: 'application-modernization',
    listView: 'application_modernization',
    formView: 'application_modernization_form',
    ns: 'admin.application_modernization',
    path: '/admin/application-modernization',
    hasThirdIntro: false,
    hasAccordion: true,
    accordionKey: 'accordion',
    hasExperience: false,
    hasOffering: true,
    hasFaq: true,
    listColumns: ['seo'],
  },
  {
    id: 'mobile_application_development',
    resource: 'mobile_application_development',
    segment: 'mobile-application-development',
    listView: 'mobile_application_development',
    formView: 'mobile_application_development_form',
    ns: 'admin.mobile_application_development',
    path: '/admin/mobile-application-development',
    hasThirdIntro: true,
    hasAccordion: true,
    accordionKey: 'accordion',
    hasExperience: false,
    hasOffering: true,
    hasFaq: true,
    listColumns: ['seo'],
  },
  {
    id: 'user_centered_design',
    resource: 'user_centered_design',
    segment: 'user-centered-design',
    listView: 'user_centered_design',
    formView: 'user_centered_design_form',
    ns: 'admin.user_centered_design',
    path: '/admin/user-centered-design',
    hasThirdIntro: false,
    hasAccordion: true,
    accordionKey: 'accordion',
    hasExperience: false,
    hasOffering: true,
    hasFaq: true,
    listColumns: ['introduction_title'],
  },
  {
    id: 'overview',
    resource: 'overview',
    segment: 'overview',
    listView: 'overview',
    formView: 'overview_form',
    ns: 'admin.overview',
    path: '/admin/overview',
    hasThirdIntro: false,
    hasAccordion: false,
    accordionKey: 'accordion',
    hasExperience: false,
    hasOffering: false,
    hasFaq: false,
    listColumns: ['introduction_title'],
  },
];

export function landingByView(view: string): LandingSection | undefined {
  return LANDING_SECTIONS.find((item) => item.listView === view || item.formView === view);
}

export function isLandingFormView(view: string): boolean {
  return LANDING_SECTIONS.some((item) => item.formView === view);
}
