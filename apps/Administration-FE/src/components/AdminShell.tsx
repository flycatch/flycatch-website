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
import { consumeMicrosoftSignIn } from '../lib/microsoft-sign-in';
import { hasTokens } from '../lib/token-store';
import { portalUrl } from '../lib/portal-link';
import { t } from '../lib/i18n';
import {
  adminFormHref,
  adminListHref,
  adminListViewOf,
  parseAdminLocation,
  readAdminLocation,
  type AdminView,
} from '../lib/admin-routes';
import { NAV_GROUPS, navGroupForView, navLabelKeyForView, type NavItem } from '../lib/admin-nav';
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
import { LANDING_SECTIONS } from '../lib/landing-sections';
import { CATALOG_SECTIONS } from '../lib/catalog-sections';
import CatalogList from './CatalogList';
import CatalogForm from './CatalogForm';

type View = AdminView;

const SUCCESS_NOTICE_MS = 4000;
const NAV_COLLAPSED_KEY = 'admin.nav.collapsed';

function readCollapsedGroups(): Set<string> {
  try {
    const raw = window.localStorage.getItem(NAV_COLLAPSED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function canManageRolesFrom(session: SessionContext | null): boolean {
  return (
    hasPermission(session, 'roles.manage') || Boolean(session?.roles?.includes('administrator'))
  );
}

function canReadResource(session: SessionContext | null, resource: string): boolean {
  return hasPermission(session, `${resource}.read`);
}

export default function AdminShell() {
  const [route, setRoute] = useState(() => readAdminLocation());
  const view: View = route.view;
  const editingId = route.editingId;
  const [session, setSession] = useState<SessionContext | null>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  useState(() => {
    consumeMicrosoftSignIn(window.location, window.history);
    return 0;
  });
  const [ready, setReady] = useState(!hasTokens());
  const [navOpen, setNavOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => readCollapsedGroups());
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

  const applyLocation = setRoute;

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
    if (view === 'role_form') {
      document.title = editingId ? t('admin.roles.edit') : t('admin.roles.add');
      return;
    }
    const labelKey = navLabelKeyForView(adminListViewOf(view));
    if (labelKey && view !== 'site_settings') {
      document.title = t(labelKey);
      return;
    }
    document.title = t('admin.workspace.site_settings');
  }, [session, view, editingId]);

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

  function toggleGroup(id: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(NAV_COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {
        // storage unavailable; the toggle still works for this page load
      }
      return next;
    });
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
  const initial = session.email.slice(0, 1).toUpperCase();
  const portalHref = portalUrl();
  const canReadSiteSettings = canReadResource(session, 'site_settings');
  const canReadNavItem = (entry: NavItem) =>
    entry.manageRoles ? canManageRoles : canReadResource(session, entry.resource);
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(canReadNavItem),
  })).filter((group) => group.items.length > 0);
  const currentListView = adminListViewOf(view);
  const currentGroupId = navGroupForView(currentListView)?.id;
  const isGroupOpen = (id: string) => id === currentGroupId || !collapsedGroups.has(id);

  if (!siteSettings) {
    const hasOtherSection = visibleGroups.length > 0;
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
          <img
            className="brand-mark"
            src="/admin/favicon.png"
            width={28}
            height={28}
            alt=""
          />
          <span>{t('admin.workspace.title')}</span>
        </div>
        <nav className="admin-nav" aria-label="Administration">
          {visibleGroups.map((group) => {
            const expanded = isGroupOpen(group.id);
            const panelId = `admin-nav-group-${group.id}`;
            return (
              <section key={group.id} className="admin-nav-group">
                <button
                  type="button"
                  className="admin-nav-group-toggle"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span>{t(group.labelKey)}</span>
                  <span className="admin-nav-chevron" aria-hidden="true" />
                </button>
                <ul id={panelId} hidden={!expanded}>
                  {group.items.map((entry) => {
                    const active = currentListView === entry.view;
                    const href = adminListHref(entry.view);
                    return (
                      <li key={entry.view}>
                        <a
                          href={href}
                          className={active ? 'active' : ''}
                          aria-current={active ? 'page' : undefined}
                          onClick={(event) => onNavClick(event, href)}
                        >
                          {t(entry.labelKey)}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
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
              {portalHref ? (
                <a className="admin-portal-link" href={portalHref}>
                  {t('admin.portal_link')}
                </a>
              ) : null}
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
              homeId={editingId}
              canPublish={canPublishHome}
              onCancel={() => openList('home')}
              onSaved={() => afterListSave(() => openList('home'), t('admin.homes.saved'))}
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
              solutionId={editingId}
              canPublish={canPublishSolutions}
              onCancel={() => openList('solutions')}
              onSaved={() => afterListSave(() => openList('solutions'), t('admin.solutions.saved'))}
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
              detailId={editingId}
              canPublish={canPublishSolutionDetails}
              onCancel={() => openList('solution_details')}
              onSaved={() => afterListSave(() => openList('solution_details'), t('admin.solution_details.saved'))}
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
              productId={editingId}
              canPublish={canPublishSolutionProducts}
              onCancel={() => openList('solution_products')}
              onSaved={() =>
                afterListSave(() => openList('solution_products'), t('admin.solution_products.saved'))
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
              entryId={editingId}
              canPublish={canPublishAiServices}
              onCancel={() => openList('ai_services')}
              onSaved={() => afterListSave(() => openList('ai_services'), t('admin.ai_services.saved'))}
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
              entryId={editingId}
              canPublish={canPublishCloudServices}
              onCancel={() => openList('cloud_services')}
              onSaved={() => afterListSave(() => openList('cloud_services'), t('admin.cloud_services.saved'))}
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
              entryId={editingId}
              canPublish={canPublishDataAnalytics}
              onCancel={() => openList('data_analytics')}
              onSaved={() => afterListSave(() => openList('data_analytics'), t('admin.data_analytics.saved'))}
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
              entryId={editingId}
              canPublish={canPublishDigitalTransformation}
              onCancel={() => openList('digital_transformation')}
              onSaved={() =>
                afterListSave(() => openList('digital_transformation'), t('admin.digital_transformation.saved'))
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
                entryId={editingId}
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
              blogId={editingId}
              onCancel={() => openList('blogs')}
              onSaved={() => afterListSave(() => openList('blogs'), t('admin.blogs.saved'))}
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
              caseStudyId={editingId}
              onCancel={() => openList('case_studies')}
              onSaved={() => afterListSave(() => openList('case_studies'), t('admin.case_studies.saved'))}
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
              industryId={editingId}
              onCancel={() => openList('industries')}
              onSaved={() => afterListSave(() => openList('industries'), t('admin.industries.saved'))}
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
              categoryId={editingId}
              onCancel={() => openList('case_study_categories')}
              onSaved={() =>
                afterListSave(() => openList('case_study_categories'), t('admin.case_study_categories.saved'))
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
              technologyId={editingId}
              onCancel={() => openList('technologies')}
              onSaved={() => afterListSave(() => openList('technologies'), t('admin.technologies.saved'))}
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
              authorId={editingId}
              onCancel={() => openList('authors')}
              onSaved={() => afterListSave(() => openList('authors'), t('admin.authors.saved'))}
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
              categoryId={editingId}
              onCancel={() => openList('categories')}
              onSaved={() => afterListSave(() => openList('categories'), t('admin.categories.saved'))}
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
              logoId={editingId}
              onCancel={() => openList('client_logos')}
              onSaved={() => afterListSave(() => openList('client_logos'), t('admin.client_logos.saved'))}
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
              testimonialId={editingId}
              onCancel={() => openList('client_testimonials')}
              onSaved={() =>
                afterListSave(() => openList('client_testimonials'), t('admin.client_testimonials.saved'))
              }
            />
          )}
          {CATALOG_SECTIONS.map((section) =>
            view === section.listView ? (
              <CatalogList
                key={`${section.resource}-${listEpoch}`}
                section={section}
                notice={message}
                onAdd={() => openForm(section.listView as AdminView, null)}
                onEdit={(id) => openForm(section.listView as AdminView, id)}
              />
            ) : view === section.formView ? (
              <CatalogForm
                key={`${section.formView}-${editingId || 'new'}`}
                section={section}
                entryId={editingId}
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
              roleId={editingId}
              onCancel={() => openList('roles')}
              onSaved={() => {
                afterListSave(() => openList('roles'), t('admin.roles.saved'));
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
