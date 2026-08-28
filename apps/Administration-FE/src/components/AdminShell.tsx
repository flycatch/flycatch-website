import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  getSession,
  getSiteSettingsRecord,
  hasPermission,
  publishRecord,
  saveSiteSettingsDraft,
  signOut,
  type SessionContext,
} from '../lib/admin-api';
import { hasTokens } from '../lib/token-store';
import { t } from '../lib/i18n';
import {
  adminFormHref,
  adminListHref,
  parseAdminLocation,
  readAdminLocation,
  type AdminView,
} from '../lib/admin-routes';
import RoleForm from './RoleForm';
import RolesList from './RolesList';
import SignInForm from './SignInForm';
import SiteSettingsEditor from './SiteSettingsEditor';
import AuthorsList from './AuthorsList';
import AuthorForm from './AuthorForm';
import BlogsList from './BlogsList';
import BlogForm from './BlogForm';
import CategoriesList from './CategoriesList';
import CategoryForm from './CategoryForm';
import ClientLogosList from './ClientLogosList';
import ClientLogoForm from './ClientLogoForm';
import ClientTestimonialsList from './ClientTestimonialsList';
import ClientTestimonialForm from './ClientTestimonialForm';
import CaseStudiesList from './CaseStudiesList';
import CaseStudyForm from './CaseStudyForm';
import IndustriesList from './IndustriesList';
import IndustryForm from './IndustryForm';
import CaseStudyCategoriesList from './CaseStudyCategoriesList';
import CaseStudyCategoryForm from './CaseStudyCategoryForm';
import TechnologiesList from './TechnologiesList';
import TechnologyForm from './TechnologyForm';
import HomesList from './HomesList';
import HomeForm from './HomeForm';
import SolutionsList from './SolutionsList';
import SolutionForm from './SolutionForm';
import SolutionDetailsList from './SolutionDetailsList';
import SolutionDetailForm from './SolutionDetailForm';
import SolutionProductsList from './SolutionProductsList';
import SolutionProductForm from './SolutionProductForm';
import AiServicesList from './AiServicesList';
import AiServiceForm from './AiServiceForm';
import CloudServicesList from './CloudServicesList';
import CloudServiceForm from './CloudServiceForm';
import DataAnalyticsList from './DataAnalyticsList';
import DataAnalyticsForm from './DataAnalyticsForm';
import DigitalTransformationList from './DigitalTransformationList';
import DigitalTransformationForm from './DigitalTransformationForm';
import LandingList from './LandingList';
import LandingForm from './LandingForm';
import { LANDING_SECTIONS, isLandingFormView, landingByView } from '../lib/landing-sections';

type View = AdminView;

const SUCCESS_NOTICE_MS = 4000;

function canManageRolesFrom(session: SessionContext | null): boolean {
  return (
    hasPermission(session, 'roles.manage') || Boolean(session?.roles?.includes('administrator'))
  );
}

function canReadResource(session: SessionContext | null, resource: string): boolean {
  return hasPermission(session, `${resource}.read`);
}

function applyRoute(
  route: ReturnType<typeof readAdminLocation>,
  setters: {
    setView: (view: View) => void;
    setEditingRoleId: (id: string | null) => void;
    setEditingBlogId: (id: string | null) => void;
    setEditingCaseStudyId: (id: string | null) => void;
    setEditingIndustryId: (id: string | null) => void;
    setEditingCaseStudyCategoryId: (id: string | null) => void;
    setEditingTechnologyId: (id: string | null) => void;
    setEditingAuthorId: (id: string | null) => void;
    setEditingCategoryId: (id: string | null) => void;
    setEditingClientLogoId: (id: string | null) => void;
    setEditingClientTestimonialId: (id: string | null) => void;
    setEditingHomeId: (id: string | null) => void;
    setEditingSolutionId: (id: string | null) => void;
    setEditingSolutionDetailId: (id: string | null) => void;
    setEditingSolutionProductId: (id: string | null) => void;
    setEditingAiServiceId: (id: string | null) => void;
    setEditingCloudServiceId: (id: string | null) => void;
    setEditingDataAnalyticId: (id: string | null) => void;
    setEditingDigitalTransformationId: (id: string | null) => void;
    setEditingLandingId: (id: string | null) => void;
  },
) {
  setters.setView(route.view);
  setters.setEditingRoleId(route.view === 'role_form' ? route.editingId : null);
  setters.setEditingBlogId(route.view === 'blog_form' ? route.editingId : null);
  setters.setEditingCaseStudyId(route.view === 'case_study_form' ? route.editingId : null);
  setters.setEditingIndustryId(route.view === 'industry_form' ? route.editingId : null);
  setters.setEditingCaseStudyCategoryId(
    route.view === 'case_study_category_form' ? route.editingId : null,
  );
  setters.setEditingTechnologyId(route.view === 'technology_form' ? route.editingId : null);
  setters.setEditingAuthorId(route.view === 'author_form' ? route.editingId : null);
  setters.setEditingCategoryId(route.view === 'category_form' ? route.editingId : null);
  setters.setEditingClientLogoId(route.view === 'client_logo_form' ? route.editingId : null);
  setters.setEditingClientTestimonialId(
    route.view === 'client_testimonial_form' ? route.editingId : null,
  );
  setters.setEditingHomeId(route.view === 'home_form' ? route.editingId : null);
  setters.setEditingSolutionId(route.view === 'solution_form' ? route.editingId : null);
  setters.setEditingSolutionDetailId(route.view === 'solution_detail_form' ? route.editingId : null);
  setters.setEditingSolutionProductId(
    route.view === 'solution_product_form' ? route.editingId : null,
  );
  setters.setEditingAiServiceId(route.view === 'ai_service_form' ? route.editingId : null);
  setters.setEditingCloudServiceId(route.view === 'cloud_service_form' ? route.editingId : null);
  setters.setEditingDataAnalyticId(route.view === 'data_analytics_form' ? route.editingId : null);
  setters.setEditingDigitalTransformationId(
    route.view === 'digital_transformation_form' ? route.editingId : null,
  );
  setters.setEditingLandingId(isLandingFormView(route.view) ? route.editingId : null);
}

export default function AdminShell() {
  const [view, setView] = useState<View>(() => readAdminLocation().view);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(
    () => {
      const route = readAdminLocation();
      return route.view === 'role_form' ? route.editingId : null;
    },
  );
  const [editingBlogId, setEditingBlogId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'blog_form' ? route.editingId : null;
  });
  const [editingCaseStudyId, setEditingCaseStudyId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'case_study_form' ? route.editingId : null;
  });
  const [editingIndustryId, setEditingIndustryId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'industry_form' ? route.editingId : null;
  });
  const [editingCaseStudyCategoryId, setEditingCaseStudyCategoryId] = useState<string | null>(
    () => {
      const route = readAdminLocation();
      return route.view === 'case_study_category_form' ? route.editingId : null;
    },
  );
  const [editingTechnologyId, setEditingTechnologyId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'technology_form' ? route.editingId : null;
  });
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'author_form' ? route.editingId : null;
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'category_form' ? route.editingId : null;
  });
  const [editingClientLogoId, setEditingClientLogoId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'client_logo_form' ? route.editingId : null;
  });
  const [editingClientTestimonialId, setEditingClientTestimonialId] = useState<string | null>(
    () => {
      const route = readAdminLocation();
      return route.view === 'client_testimonial_form' ? route.editingId : null;
    },
  );
  const [editingHomeId, setEditingHomeId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'home_form' ? route.editingId : null;
  });
  const [editingSolutionId, setEditingSolutionId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'solution_form' ? route.editingId : null;
  });
  const [editingSolutionDetailId, setEditingSolutionDetailId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'solution_detail_form' ? route.editingId : null;
  });
  const [editingSolutionProductId, setEditingSolutionProductId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'solution_product_form' ? route.editingId : null;
  });
  const [editingAiServiceId, setEditingAiServiceId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'ai_service_form' ? route.editingId : null;
  });
  const [editingCloudServiceId, setEditingCloudServiceId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'cloud_service_form' ? route.editingId : null;
  });
  const [editingDataAnalyticId, setEditingDataAnalyticId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return route.view === 'data_analytics_form' ? route.editingId : null;
  });
  const [editingDigitalTransformationId, setEditingDigitalTransformationId] = useState<
    string | null
  >(() => {
    const route = readAdminLocation();
    return route.view === 'digital_transformation_form' ? route.editingId : null;
  });
  const [editingLandingId, setEditingLandingId] = useState<string | null>(() => {
    const route = readAdminLocation();
    return isLandingFormView(route.view) ? route.editingId : null;
  });
  const [session, setSession] = useState<SessionContext | null>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [ready, setReady] = useState(!hasTokens());
  const [navOpen, setNavOpen] = useState(false);
  const [listEpoch, setListEpoch] = useState(0);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccess = useCallback(() => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
    setMessage(null);
  }, []);

  const showSuccess = useCallback((text: string) => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    setMessage(text);
    messageTimerRef.current = setTimeout(() => {
      setMessage(null);
      messageTimerRef.current = null;
    }, SUCCESS_NOTICE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  const applyLocation = useCallback((route: ReturnType<typeof readAdminLocation>) => {
    applyRoute(route, {
      setView,
      setEditingRoleId,
      setEditingBlogId,
      setEditingCaseStudyId,
      setEditingIndustryId,
      setEditingCaseStudyCategoryId,
      setEditingTechnologyId,
      setEditingAuthorId,
      setEditingCategoryId,
      setEditingClientLogoId,
      setEditingClientTestimonialId,
      setEditingHomeId,
      setEditingSolutionId,
      setEditingSolutionDetailId,
      setEditingSolutionProductId,
      setEditingAiServiceId,
      setEditingCloudServiceId,
      setEditingDataAnalyticId,
      setEditingDigitalTransformationId,
      setEditingLandingId,
    });
  }, []);

  const navigate = useCallback(
    (href: string, replace = false) => {
      const url = new URL(href, window.location.origin);
      const next = parseAdminLocation(url.pathname, url.search);
      const current = `${window.location.pathname}${window.location.search}`;
      const target = `${url.pathname}${url.search}`;
      if (replace) {
        window.history.replaceState(null, '', target);
      } else if (current !== target) {
        window.history.pushState(null, '', target);
      }
      applyLocation(next);
    },
    [applyLocation],
  );

  const loadWorkspace = useCallback(async () => {
    setWorkspaceError(null);
    const nextSession = await getSession();
    setSession(nextSession);
    try {
      if (hasPermission(nextSession, 'site_settings.read')) {
        const settings = await getSiteSettingsRecord();
        setSiteSettings(settings as Record<string, unknown>);
      } else {
        setSiteSettings(null);
      }
    } catch {
      setSiteSettings(null);
      setWorkspaceError(t('admin.workspace.load_failed'));
      if (canManageRolesFrom(nextSession)) {
        navigate(adminListHref('roles'), true);
      }
    } finally {
      setReady(true);
    }
  }, [navigate]);

  useEffect(() => {
    if (!hasTokens()) {
      setReady(true);
      return;
    }
    loadWorkspace().catch(() => {
      setSession(null);
      setReady(true);
    });
  }, [loadWorkspace]);

  useEffect(() => {
    function onPopState() {
      applyLocation(readAdminLocation());
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyLocation]);

  useEffect(() => {
    if (!session) {
      document.title = t('admin.sign_in.title');
      return;
    }
    if (view === 'home' || view === 'home_form') {
      document.title = t('admin.workspace.home_page');
      return;
    }
    if (view === 'solutions' || view === 'solution_form') {
      document.title = t('admin.workspace.solutions');
      return;
    }
    if (view === 'solution_details' || view === 'solution_detail_form') {
      document.title = t('admin.workspace.solution_details');
      return;
    }
    if (view === 'solution_products' || view === 'solution_product_form') {
      document.title = t('admin.workspace.solution_products');
      return;
    }
    if (view === 'ai_services' || view === 'ai_service_form') {
      document.title = t('admin.workspace.ai_services');
      return;
    }
    if (view === 'cloud_services' || view === 'cloud_service_form') {
      document.title = t('admin.workspace.cloud_services');
      return;
    }
    if (view === 'data_analytics' || view === 'data_analytics_form') {
      document.title = t('admin.workspace.data_analytics');
      return;
    }
    if (view === 'digital_transformation' || view === 'digital_transformation_form') {
      document.title = t('admin.workspace.digital_transformation');
      return;
    }
    const landing = landingByView(view);
    if (landing) {
      document.title = t(`admin.workspace.${landing.resource}`);
      return;
    }
    if (view === 'blogs' || view === 'blog_form') {
      document.title = t('admin.workspace.blogs');
      return;
    }
    if (view === 'case_studies' || view === 'case_study_form') {
      document.title = t('admin.workspace.case_studies');
      return;
    }
    if (view === 'industries' || view === 'industry_form') {
      document.title = t('admin.workspace.industries');
      return;
    }
    if (view === 'case_study_categories' || view === 'case_study_category_form') {
      document.title = t('admin.workspace.case_study_categories');
      return;
    }
    if (view === 'technologies' || view === 'technology_form') {
      document.title = t('admin.workspace.technologies');
      return;
    }
    if (view === 'authors' || view === 'author_form') {
      document.title = t('admin.workspace.authors');
      return;
    }
    if (view === 'categories' || view === 'category_form') {
      document.title = t('admin.workspace.categories');
      return;
    }
    if (view === 'client_logos' || view === 'client_logo_form') {
      document.title = t('admin.workspace.client_logos');
      return;
    }
    if (view === 'client_testimonials' || view === 'client_testimonial_form') {
      document.title = t('admin.workspace.client_testimonials');
      return;
    }
    if (view === 'roles') {
      document.title = t('admin.workspace.settings');
      return;
    }
    if (view === 'role_form') {
      document.title = editingRoleId ? t('admin.roles.edit') : t('admin.roles.add');
      return;
    }
    document.title = t('admin.workspace.site_settings');
  }, [session, view, editingRoleId]);

  useEffect(() => {
    if (!navOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.body.classList.add('admin-nav-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('admin-nav-open');
    };
  }, [navOpen]);

  async function refreshData() {
    const settings = await getSiteSettingsRecord();
    setSiteSettings(settings as Record<string, unknown>);
  }

  async function handleSignedIn() {
    setError(null);
    setWorkspaceError(null);
    try {
      await loadWorkspace();
      if (window.location.pathname.includes('sign-in')) {
        navigate(adminListHref('site_settings'), true);
      }
    } catch {
      // loadWorkspace sets workspaceError when records are missing
    }
  }

  async function handleSignOut() {
    await signOut();
    setSession(null);
    setSiteSettings(null);
    clearSuccess();
    setError(null);
    setWorkspaceError(null);
    setNavOpen(false);
  }

  function openList(listView: View) {
    clearSuccess();
    setError(null);
    setNavOpen(false);
    navigate(adminListHref(listView));
  }

  function openForm(listView: View, id: string | null) {
    clearSuccess();
    setError(null);
    navigate(adminFormHref(listView, id));
  }

  function afterListSave(openSection: () => void, successMessage: string) {
    openSection();
    setListEpoch((value) => value + 1);
    showSuccess(successMessage);
  }

  function openRoles() {
    openList('roles');
  }

  function openBlogs() {
    openList('blogs');
  }

  function openCaseStudies() {
    openList('case_studies');
  }

  function openIndustries() {
    openList('industries');
  }

  function openCaseStudyCategories() {
    openList('case_study_categories');
  }

  function openTechnologies() {
    openList('technologies');
  }

  function openAuthors() {
    openList('authors');
  }

  function openCategories() {
    openList('categories');
  }

  function openClientLogos() {
    openList('client_logos');
  }

  function openClientTestimonials() {
    openList('client_testimonials');
  }

  function openHomes() {
    openList('home');
  }

  function openSolutions() {
    openList('solutions');
  }

  function openSolutionDetails() {
    openList('solution_details');
  }

  function openSolutionProducts() {
    openList('solution_products');
  }

  function openAiServices() {
    openList('ai_services');
  }

  function openCloudServices() {
    openList('cloud_services');
  }

  function openDataAnalytics() {
    openList('data_analytics');
  }

  function openDigitalTransformation() {
    openList('digital_transformation');
  }

  function onNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    openList(parseAdminLocation(href).view);
  }

  if (!ready) {
    return (
      <main id="main" className="auth-layout">
        <p className="loading-state" role="status">
          <span className="spinner" aria-hidden="true" />
          {t('admin.workspace.loading')}
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <main id="main" className="auth-layout">
        <SignInForm onSignedIn={handleSignedIn} />
      </main>
    );
  }

  const canDraft = hasPermission(session, 'site_settings.update');
  const canPublish = hasPermission(session, 'site_settings.publish');
  const canPublishHome = hasPermission(session, 'home.publish');
  const canPublishSolutions = hasPermission(session, 'solutions.publish');
  const canPublishSolutionDetails = hasPermission(session, 'solution_details.publish');
  const canPublishSolutionProducts = hasPermission(session, 'solution_products.publish');
  const canPublishAiServices = hasPermission(session, 'ai_services.publish');
  const canPublishCloudServices = hasPermission(session, 'cloud_services.publish');
  const canPublishDataAnalytics = hasPermission(session, 'data_analytics.publish');
  const canPublishDigitalTransformation = hasPermission(session, 'digital_transformation.publish');
  const canReadLandings = Object.fromEntries(
    LANDING_SECTIONS.map((section) => [section.resource, canReadResource(session, section.resource)]),
  );
  const canPublishLandings = Object.fromEntries(
    LANDING_SECTIONS.map((section) => [
      section.resource,
      hasPermission(session, `${section.resource}.publish`),
    ]),
  );
  const canManageRoles = canManageRolesFrom(session);
  const settingsCurrent = view === 'roles' || view === 'role_form';
  const initial = session.email.slice(0, 1).toUpperCase();
  const canReadSiteSettings = canReadResource(session, 'site_settings');
  const canReadHome = canReadResource(session, 'home');
  const canReadSolutions = canReadResource(session, 'solutions');
  const canReadSolutionDetails = canReadResource(session, 'solution_details');
  const canReadSolutionProducts = canReadResource(session, 'solution_products');
  const canReadAiServices = canReadResource(session, 'ai_services');
  const canReadCloudServices = canReadResource(session, 'cloud_services');
  const canReadDataAnalytics = canReadResource(session, 'data_analytics');
  const canReadDigitalTransformation = canReadResource(session, 'digital_transformation');
  const canReadBlogs = canReadResource(session, 'blogs');
  const canReadCaseStudies = canReadResource(session, 'case_studies');
  const canReadIndustries = canReadResource(session, 'industries');
  const canReadCaseStudyCategories = canReadResource(session, 'case_study_categories');
  const canReadTechnologies = canReadResource(session, 'technologies');
  const canReadAuthors = canReadResource(session, 'authors');
  const canReadCategories = canReadResource(session, 'categories');
  const canReadClientLogos = canReadResource(session, 'client_logos');
  const canReadClientTestimonials = canReadResource(session, 'client_testimonials');

  if (!siteSettings) {
    const hasOtherSection =
      canManageRoles ||
      canReadHome ||
      canReadSolutions ||
      canReadSolutionDetails ||
      canReadSolutionProducts ||
      canReadAiServices ||
      canReadCloudServices ||
      canReadDataAnalytics ||
      canReadDigitalTransformation ||
      LANDING_SECTIONS.some((section) => canReadLandings[section.resource]) ||
      canReadBlogs ||
      canReadCaseStudies ||
      canReadIndustries ||
      canReadCaseStudyCategories ||
      canReadTechnologies ||
      canReadAuthors ||
      canReadCategories ||
      canReadClientLogos ||
      canReadClientTestimonials;
    if (!hasOtherSection && (workspaceError || !canReadSiteSettings)) {
      return (
        <main id="main" className="auth-layout">
          <div className="auth-card">
            <h1>{t('admin.workspace.title')}</h1>
            <p className="alert alert-error error" role="alert">
              {workspaceError || t('admin.workspace.load_failed')}
            </p>
            <button type="button" onClick={handleSignOut}>
              {t('admin.sign_out')}
            </button>
          </div>
        </main>
      );
    }
  }

  return (
    <div className="admin-app">
      {navOpen ? (
        <div
          className="admin-nav-backdrop"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside id="admin-sidebar" className={navOpen ? 'admin-sidebar is-open' : 'admin-sidebar'}>
        <div className="admin-brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>{t('admin.workspace.title')}</span>
        </div>
        <nav className="admin-nav" aria-label="Administration">
          <ul>
            {canReadSiteSettings && (
            <li>
              <a
                href={adminListHref('site_settings')}
                className={view === 'site_settings' ? 'active' : ''}
                aria-current={view === 'site_settings' ? 'page' : undefined}
                onClick={(event) => onNavClick(event, adminListHref('site_settings'))}
              >
                {t('admin.workspace.site_settings')}
              </a>
            </li>
            )}
            {canReadHome && (
            <li>
              <a
                href={adminListHref('home')}
                className={view === 'home' || view === 'home_form' ? 'active' : ''}
                aria-current={view === 'home' || view === 'home_form' ? 'page' : undefined}
                onClick={(event) => onNavClick(event, adminListHref('home'))}
              >
                {t('admin.workspace.home_page')}
              </a>
            </li>
            )}
            {canReadSolutions && (
            <li>
              <a
                href={adminListHref('solutions')}
                className={view === 'solutions' || view === 'solution_form' ? 'active' : ''}
                aria-current={
                  view === 'solutions' || view === 'solution_form' ? 'page' : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('solutions'))}
              >
                {t('admin.workspace.solutions')}
              </a>
            </li>
            )}
            {canReadSolutionDetails && (
            <li>
              <a
                href={adminListHref('solution_details')}
                className={
                  view === 'solution_details' || view === 'solution_detail_form' ? 'active' : ''
                }
                aria-current={
                  view === 'solution_details' || view === 'solution_detail_form' ? 'page' : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('solution_details'))}
              >
                {t('admin.workspace.solution_details')}
              </a>
            </li>
            )}
            {canReadSolutionProducts && (
            <li>
              <a
                href={adminListHref('solution_products')}
                className={
                  view === 'solution_products' || view === 'solution_product_form' ? 'active' : ''
                }
                aria-current={
                  view === 'solution_products' || view === 'solution_product_form'
                    ? 'page'
                    : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('solution_products'))}
              >
                {t('admin.workspace.solution_products')}
              </a>
            </li>
            )}
            {canReadAiServices && (
            <li>
              <a
                href={adminListHref('ai_services')}
                className={view === 'ai_services' || view === 'ai_service_form' ? 'active' : ''}
                aria-current={
                  view === 'ai_services' || view === 'ai_service_form' ? 'page' : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('ai_services'))}
              >
                {t('admin.workspace.ai_services')}
              </a>
            </li>
            )}
            {canReadCloudServices && (
            <li>
              <a
                href={adminListHref('cloud_services')}
                className={
                  view === 'cloud_services' || view === 'cloud_service_form' ? 'active' : ''
                }
                aria-current={
                  view === 'cloud_services' || view === 'cloud_service_form' ? 'page' : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('cloud_services'))}
              >
                {t('admin.workspace.cloud_services')}
              </a>
            </li>
            )}
            {canReadDataAnalytics && (
            <li>
              <a
                href={adminListHref('data_analytics')}
                className={
                  view === 'data_analytics' || view === 'data_analytics_form' ? 'active' : ''
                }
                aria-current={
                  view === 'data_analytics' || view === 'data_analytics_form' ? 'page' : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('data_analytics'))}
              >
                {t('admin.workspace.data_analytics')}
              </a>
            </li>
            )}
            {canReadDigitalTransformation && (
            <li>
              <a
                href={adminListHref('digital_transformation')}
                className={
                  view === 'digital_transformation' || view === 'digital_transformation_form'
                    ? 'active'
                    : ''
                }
                aria-current={
                  view === 'digital_transformation' || view === 'digital_transformation_form'
                    ? 'page'
                    : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('digital_transformation'))}
              >
                {t('admin.workspace.digital_transformation')}
              </a>
            </li>
            )}
            {LANDING_SECTIONS.map(
              (section) =>
                canReadLandings[section.resource] && (
                  <li key={section.resource}>
                    <a
                      href={adminListHref(section.listView as AdminView)}
                      className={view === section.listView || view === section.formView ? 'active' : ''}
                      aria-current={
                        view === section.listView || view === section.formView ? 'page' : undefined
                      }
                      onClick={(event) =>
                        onNavClick(event, adminListHref(section.listView as AdminView))
                      }
                    >
                      {t(`admin.workspace.${section.resource}`)}
                    </a>
                  </li>
                ),
            )}
            {canReadBlogs && (
            <li>
              <a
                href={adminListHref('blogs')}
                className={view === 'blogs' || view === 'blog_form' ? 'active' : ''}
                aria-current={view === 'blogs' || view === 'blog_form' ? 'page' : undefined}
                onClick={(event) => onNavClick(event, adminListHref('blogs'))}
              >
                {t('admin.workspace.blogs')}
              </a>
            </li>
            )}
            {canReadCaseStudies && (
            <li>
              <a
                href={adminListHref('case_studies')}
                className={view === 'case_studies' || view === 'case_study_form' ? 'active' : ''}
                aria-current={
                  view === 'case_studies' || view === 'case_study_form' ? 'page' : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('case_studies'))}
              >
                {t('admin.workspace.case_studies')}
              </a>
            </li>
            )}
            {canReadIndustries && (
            <li>
              <a
                href={adminListHref('industries')}
                className={view === 'industries' || view === 'industry_form' ? 'active' : ''}
                aria-current={view === 'industries' || view === 'industry_form' ? 'page' : undefined}
                onClick={(event) => onNavClick(event, adminListHref('industries'))}
              >
                {t('admin.workspace.industries')}
              </a>
            </li>
            )}
            {canReadCaseStudyCategories && (
            <li>
              <a
                href={adminListHref('case_study_categories')}
                className={
                  view === 'case_study_categories' || view === 'case_study_category_form'
                    ? 'active'
                    : ''
                }
                aria-current={
                  view === 'case_study_categories' || view === 'case_study_category_form'
                    ? 'page'
                    : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('case_study_categories'))}
              >
                {t('admin.workspace.case_study_categories')}
              </a>
            </li>
            )}
            {canReadTechnologies && (
            <li>
              <a
                href={adminListHref('technologies')}
                className={view === 'technologies' || view === 'technology_form' ? 'active' : ''}
                aria-current={
                  view === 'technologies' || view === 'technology_form' ? 'page' : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('technologies'))}
              >
                {t('admin.workspace.technologies')}
              </a>
            </li>
            )}
            {canReadAuthors && (
            <li>
              <a
                href={adminListHref('authors')}
                className={view === 'authors' || view === 'author_form' ? 'active' : ''}
                aria-current={view === 'authors' || view === 'author_form' ? 'page' : undefined}
                onClick={(event) => onNavClick(event, adminListHref('authors'))}
              >
                {t('admin.workspace.authors')}
              </a>
            </li>
            )}
            {canReadCategories && (
            <li>
              <a
                href={adminListHref('categories')}
                className={view === 'categories' || view === 'category_form' ? 'active' : ''}
                aria-current={view === 'categories' || view === 'category_form' ? 'page' : undefined}
                onClick={(event) => onNavClick(event, adminListHref('categories'))}
              >
                {t('admin.workspace.categories')}
              </a>
            </li>
            )}
            {canReadClientLogos && (
            <li>
              <a
                href={adminListHref('client_logos')}
                className={view === 'client_logos' || view === 'client_logo_form' ? 'active' : ''}
                aria-current={
                  view === 'client_logos' || view === 'client_logo_form' ? 'page' : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('client_logos'))}
              >
                {t('admin.workspace.client_logos')}
              </a>
            </li>
            )}
            {canReadClientTestimonials && (
            <li>
              <a
                href={adminListHref('client_testimonials')}
                className={
                  view === 'client_testimonials' || view === 'client_testimonial_form'
                    ? 'active'
                    : ''
                }
                aria-current={
                  view === 'client_testimonials' || view === 'client_testimonial_form'
                    ? 'page'
                    : undefined
                }
                onClick={(event) => onNavClick(event, adminListHref('client_testimonials'))}
              >
                {t('admin.workspace.client_testimonials')}
              </a>
            </li>
            )}
            {canManageRoles && (
              <li>
                <a
                  href={adminListHref('roles')}
                  className={settingsCurrent ? 'active' : ''}
                  aria-current={settingsCurrent ? 'page' : undefined}
                  onClick={(event) => onNavClick(event, adminListHref('roles'))}
                >
                  {t('admin.workspace.settings')}
                </a>
              </li>
            )}
          </ul>
        </nav>
      </aside>
      <div className="admin-frame">
        <header className="admin-header">
          <div className="admin-header-inner">
            <button
              type="button"
              className="admin-nav-toggle"
              aria-expanded={navOpen}
              aria-controls="admin-sidebar"
              aria-label={navOpen ? t('admin.nav.close') : t('admin.nav.open')}
              onClick={() => setNavOpen((open) => !open)}
            >
              <span className="admin-nav-toggle-bars" aria-hidden="true" />
            </button>
            <h1>{t('admin.workspace.title')}</h1>
            <div className="admin-header-user">
              <span className="admin-avatar" aria-hidden="true">
                {initial}
              </span>
              <p>{session.email}</p>
              <button type="button" onClick={handleSignOut}>
                {t('admin.sign_out')}
              </button>
            </div>
          </div>
        </header>
        <main id="main" className="admin-main">
          {message && view === 'site_settings' && (
            <p className="alert alert-success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="alert alert-error error" role="alert">
              {error}
            </p>
          )}
          {view === 'site_settings' && siteSettings && (
            <SiteSettingsEditor
              record={siteSettings}
              canDraft={canDraft}
              canPublish={canPublish}
              onSaveDraft={async (draft) => {
                await saveSiteSettingsDraft(draft);
                showSuccess(t('admin.draft.saved'));
                await refreshData();
              }}
              onPublish={async () => {
                if (!canPublish) {
                  setError(t('admin.action.forbidden'));
                  return;
                }
                await publishRecord('site_settings', 'default');
                showSuccess(t('admin.publish.success'));
                await refreshData();
              }}
            />
          )}
          {view === 'home' && (
            <HomesList
              key={`home-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('home', null)}
              onEdit={(id) => openForm('home', id)}
            />
          )}
          {view === 'home_form' && (
            <HomeForm
              homeId={editingHomeId}
              canPublish={canPublishHome}
              onCancel={openHomes}
              onSaved={() => afterListSave(openHomes, t('admin.homes.saved'))}
            />
          )}
          {view === 'solutions' && (
            <SolutionsList
              key={`solutions-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('solutions', null)}
              onEdit={(id) => openForm('solutions', id)}
            />
          )}
          {view === 'solution_form' && (
            <SolutionForm
              solutionId={editingSolutionId}
              canPublish={canPublishSolutions}
              onCancel={openSolutions}
              onSaved={() => afterListSave(openSolutions, t('admin.solutions.saved'))}
            />
          )}
          {view === 'solution_details' && (
            <SolutionDetailsList
              key={`solution-details-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('solution_details', null)}
              onEdit={(id) => openForm('solution_details', id)}
            />
          )}
          {view === 'solution_detail_form' && (
            <SolutionDetailForm
              detailId={editingSolutionDetailId}
              canPublish={canPublishSolutionDetails}
              onCancel={openSolutionDetails}
              onSaved={() => afterListSave(openSolutionDetails, t('admin.solution_details.saved'))}
            />
          )}
          {view === 'solution_products' && (
            <SolutionProductsList
              key={`solution-products-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('solution_products', null)}
              onEdit={(id) => openForm('solution_products', id)}
            />
          )}
          {view === 'solution_product_form' && (
            <SolutionProductForm
              productId={editingSolutionProductId}
              canPublish={canPublishSolutionProducts}
              onCancel={openSolutionProducts}
              onSaved={() =>
                afterListSave(openSolutionProducts, t('admin.solution_products.saved'))
              }
            />
          )}
          {view === 'ai_services' && (
            <AiServicesList
              key={`ai-services-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('ai_services', null)}
              onEdit={(id) => openForm('ai_services', id)}
            />
          )}
          {view === 'ai_service_form' && (
            <AiServiceForm
              entryId={editingAiServiceId}
              canPublish={canPublishAiServices}
              onCancel={openAiServices}
              onSaved={() => afterListSave(openAiServices, t('admin.ai_services.saved'))}
            />
          )}
          {view === 'cloud_services' && (
            <CloudServicesList
              key={`cloud-services-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('cloud_services', null)}
              onEdit={(id) => openForm('cloud_services', id)}
            />
          )}
          {view === 'cloud_service_form' && (
            <CloudServiceForm
              entryId={editingCloudServiceId}
              canPublish={canPublishCloudServices}
              onCancel={openCloudServices}
              onSaved={() => afterListSave(openCloudServices, t('admin.cloud_services.saved'))}
            />
          )}
          {view === 'data_analytics' && (
            <DataAnalyticsList
              key={`data-analytics-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('data_analytics', null)}
              onEdit={(id) => openForm('data_analytics', id)}
            />
          )}
          {view === 'data_analytics_form' && (
            <DataAnalyticsForm
              entryId={editingDataAnalyticId}
              canPublish={canPublishDataAnalytics}
              onCancel={openDataAnalytics}
              onSaved={() => afterListSave(openDataAnalytics, t('admin.data_analytics.saved'))}
            />
          )}
          {view === 'digital_transformation' && (
            <DigitalTransformationList
              key={`digital-transformation-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('digital_transformation', null)}
              onEdit={(id) => openForm('digital_transformation', id)}
            />
          )}
          {view === 'digital_transformation_form' && (
            <DigitalTransformationForm
              entryId={editingDigitalTransformationId}
              canPublish={canPublishDigitalTransformation}
              onCancel={openDigitalTransformation}
              onSaved={() =>
                afterListSave(openDigitalTransformation, t('admin.digital_transformation.saved'))
              }
            />
          )}
          {LANDING_SECTIONS.map((section) =>
            view === section.listView ? (
              <LandingList
                key={`${section.resource}-${listEpoch}`}
                section={section}
                notice={message}
                onAdd={() => openForm(section.listView as AdminView, null)}
                onEdit={(id) => openForm(section.listView as AdminView, id)}
              />
            ) : view === section.formView ? (
              <LandingForm
                key={`${section.resource}-form`}
                section={section}
                entryId={editingLandingId}
                canPublish={Boolean(canPublishLandings[section.resource])}
                onCancel={() => openList(section.listView as AdminView)}
                onSaved={() =>
                  afterListSave(
                    () => openList(section.listView as AdminView),
                    t(`${section.ns}.saved`),
                  )
                }
              />
            ) : null,
          )}
          {view === 'blogs' && (
            <BlogsList
              key={`blogs-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('blogs', null)}
              onEdit={(id) => openForm('blogs', id)}
            />
          )}
          {view === 'blog_form' && (
            <BlogForm
              blogId={editingBlogId}
              onCancel={openBlogs}
              onSaved={() => afterListSave(openBlogs, t('admin.blogs.saved'))}
            />
          )}
          {view === 'case_studies' && (
            <CaseStudiesList
              key={`case-studies-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('case_studies', null)}
              onEdit={(id) => openForm('case_studies', id)}
            />
          )}
          {view === 'case_study_form' && (
            <CaseStudyForm
              caseStudyId={editingCaseStudyId}
              onCancel={openCaseStudies}
              onSaved={() => afterListSave(openCaseStudies, t('admin.case_studies.saved'))}
            />
          )}
          {view === 'industries' && (
            <IndustriesList
              key={`industries-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('industries', null)}
              onEdit={(id) => openForm('industries', id)}
            />
          )}
          {view === 'industry_form' && (
            <IndustryForm
              industryId={editingIndustryId}
              onCancel={openIndustries}
              onSaved={() => afterListSave(openIndustries, t('admin.industries.saved'))}
            />
          )}
          {view === 'case_study_categories' && (
            <CaseStudyCategoriesList
              key={`case-study-categories-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('case_study_categories', null)}
              onEdit={(id) => openForm('case_study_categories', id)}
            />
          )}
          {view === 'case_study_category_form' && (
            <CaseStudyCategoryForm
              categoryId={editingCaseStudyCategoryId}
              onCancel={openCaseStudyCategories}
              onSaved={() =>
                afterListSave(openCaseStudyCategories, t('admin.case_study_categories.saved'))
              }
            />
          )}
          {view === 'technologies' && (
            <TechnologiesList
              key={`technologies-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('technologies', null)}
              onEdit={(id) => openForm('technologies', id)}
            />
          )}
          {view === 'technology_form' && (
            <TechnologyForm
              technologyId={editingTechnologyId}
              onCancel={openTechnologies}
              onSaved={() => afterListSave(openTechnologies, t('admin.technologies.saved'))}
            />
          )}
          {view === 'authors' && (
            <AuthorsList
              key={`authors-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('authors', null)}
              onEdit={(id) => openForm('authors', id)}
            />
          )}
          {view === 'author_form' && (
            <AuthorForm
              authorId={editingAuthorId}
              onCancel={openAuthors}
              onSaved={() => afterListSave(openAuthors, t('admin.authors.saved'))}
            />
          )}
          {view === 'categories' && (
            <CategoriesList
              key={`categories-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('categories', null)}
              onEdit={(id) => openForm('categories', id)}
            />
          )}
          {view === 'category_form' && (
            <CategoryForm
              categoryId={editingCategoryId}
              onCancel={openCategories}
              onSaved={() => afterListSave(openCategories, t('admin.categories.saved'))}
            />
          )}
          {view === 'client_logos' && (
            <ClientLogosList
              key={`client-logos-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('client_logos', null)}
              onEdit={(id) => openForm('client_logos', id)}
            />
          )}
          {view === 'client_logo_form' && (
            <ClientLogoForm
              logoId={editingClientLogoId}
              onCancel={openClientLogos}
              onSaved={() => afterListSave(openClientLogos, t('admin.client_logos.saved'))}
            />
          )}
          {view === 'client_testimonials' && (
            <ClientTestimonialsList
              key={`client-testimonials-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('client_testimonials', null)}
              onEdit={(id) => openForm('client_testimonials', id)}
            />
          )}
          {view === 'client_testimonial_form' && (
            <ClientTestimonialForm
              testimonialId={editingClientTestimonialId}
              onCancel={openClientTestimonials}
              onSaved={() =>
                afterListSave(openClientTestimonials, t('admin.client_testimonials.saved'))
              }
            />
          )}
          {view === 'roles' && (
            <RolesList
              key={`roles-${listEpoch}`}
              notice={message}
              onAdd={() => openForm('roles', null)}
              onEdit={(id) => openForm('roles', id)}
            />
          )}
          {view === 'role_form' && (
            <RoleForm
              roleId={editingRoleId}
              onCancel={openRoles}
              onSaved={() => {
                afterListSave(openRoles, t('admin.roles.saved'));
                getSession()
                  .then((nextSession) => setSession(nextSession))
                  .catch(() => undefined);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
