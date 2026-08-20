import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import {
  getPageRecord,
  getSession,
  getSiteSettingsRecord,
  hasPermission,
  publishRecord,
  savePageDraft,
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
import PageEditor from './PageEditor';
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
import CaseStudiesList from './CaseStudiesList';
import CaseStudyForm from './CaseStudyForm';
import IndustriesList from './IndustriesList';
import IndustryForm from './IndustryForm';
import CaseStudyCategoriesList from './CaseStudyCategoriesList';
import CaseStudyCategoryForm from './CaseStudyCategoryForm';
import TechnologiesList from './TechnologiesList';
import TechnologyForm from './TechnologyForm';

type View = AdminView;

function canManageRolesFrom(session: SessionContext | null): boolean {
  return (
    hasPermission(session, 'roles.manage') || Boolean(session?.roles?.includes('administrator'))
  );
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
  const [session, setSession] = useState<SessionContext | null>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown> | null>(null);
  const [homePage, setHomePage] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [ready, setReady] = useState(!hasTokens());
  const [navOpen, setNavOpen] = useState(false);

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
      const settings = await getSiteSettingsRecord();
      setSiteSettings(settings as Record<string, unknown>);
      const page = await getPageRecord('home');
      setHomePage(page as Record<string, unknown>);
    } catch {
      setSiteSettings(null);
      setHomePage(null);
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
    if (view === 'home') {
      document.title = t('admin.workspace.home_page');
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
    const page = await getPageRecord('home');
    setHomePage(page as Record<string, unknown>);
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
    setHomePage(null);
    setMessage(null);
    setError(null);
    setWorkspaceError(null);
    setNavOpen(false);
  }

  function openList(listView: View) {
    setError(null);
    setNavOpen(false);
    navigate(adminListHref(listView));
  }

  function openForm(listView: View, id: string | null) {
    setMessage(null);
    setError(null);
    navigate(adminFormHref(listView, id));
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

  const canDraft = hasPermission(session, 'drafts.save');
  const canPublish = hasPermission(session, 'records.publish');
  const canManageRoles = canManageRolesFrom(session);
  const settingsCurrent = view === 'roles' || view === 'role_form';
  const initial = session.email.slice(0, 1).toUpperCase();

  if (!siteSettings || !homePage) {
    if (!canManageRoles) {
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
            <li>
              <a
                href={adminListHref('home')}
                className={view === 'home' ? 'active' : ''}
                aria-current={view === 'home' ? 'page' : undefined}
                onClick={(event) => onNavClick(event, adminListHref('home'))}
              >
                {t('admin.workspace.home_page')}
              </a>
            </li>
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
          {message && (view === 'site_settings' || view === 'home') && (
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
                setMessage(t('admin.draft.saved'));
                await refreshData();
              }}
              onPublish={async () => {
                if (!canPublish) {
                  setError(t('admin.action.forbidden'));
                  return;
                }
                await publishRecord('site_settings', 'default');
                setMessage(t('admin.publish.success'));
                await refreshData();
              }}
            />
          )}
          {view === 'home' && homePage && (
            <PageEditor
              record={homePage}
              canDraft={canDraft}
              canPublish={canPublish}
              onSaveDraft={async (draft) => {
                await savePageDraft('home', draft);
                setMessage(t('admin.draft.saved'));
                await refreshData();
              }}
              onPublish={async () => {
                if (!canPublish) {
                  setError(t('admin.action.forbidden'));
                  return;
                }
                await publishRecord('page', 'home');
                setMessage(t('admin.publish.success'));
                await refreshData();
              }}
            />
          )}
          {view === 'blogs' && (
            <BlogsList
              notice={message}
              onAdd={() => openForm('blogs', null)}
              onEdit={(id) => openForm('blogs', id)}
            />
          )}
          {view === 'blog_form' && (
            <BlogForm
              blogId={editingBlogId}
              onCancel={openBlogs}
              onSaved={() => {
                setMessage(t('admin.blogs.saved'));
                openBlogs();
              }}
            />
          )}
          {view === 'case_studies' && (
            <CaseStudiesList
              notice={message}
              onAdd={() => openForm('case_studies', null)}
              onEdit={(id) => openForm('case_studies', id)}
            />
          )}
          {view === 'case_study_form' && (
            <CaseStudyForm
              caseStudyId={editingCaseStudyId}
              onCancel={openCaseStudies}
              onSaved={() => {
                setMessage(t('admin.case_studies.saved'));
                openCaseStudies();
              }}
            />
          )}
          {view === 'industries' && (
            <IndustriesList
              notice={message}
              onAdd={() => openForm('industries', null)}
              onEdit={(id) => openForm('industries', id)}
            />
          )}
          {view === 'industry_form' && (
            <IndustryForm
              industryId={editingIndustryId}
              onCancel={openIndustries}
              onSaved={() => {
                setMessage(t('admin.industries.saved'));
                openIndustries();
              }}
            />
          )}
          {view === 'case_study_categories' && (
            <CaseStudyCategoriesList
              notice={message}
              onAdd={() => openForm('case_study_categories', null)}
              onEdit={(id) => openForm('case_study_categories', id)}
            />
          )}
          {view === 'case_study_category_form' && (
            <CaseStudyCategoryForm
              categoryId={editingCaseStudyCategoryId}
              onCancel={openCaseStudyCategories}
              onSaved={() => {
                setMessage(t('admin.case_study_categories.saved'));
                openCaseStudyCategories();
              }}
            />
          )}
          {view === 'technologies' && (
            <TechnologiesList
              notice={message}
              onAdd={() => openForm('technologies', null)}
              onEdit={(id) => openForm('technologies', id)}
            />
          )}
          {view === 'technology_form' && (
            <TechnologyForm
              technologyId={editingTechnologyId}
              onCancel={openTechnologies}
              onSaved={() => {
                setMessage(t('admin.technologies.saved'));
                openTechnologies();
              }}
            />
          )}
          {view === 'authors' && (
            <AuthorsList
              notice={message}
              onAdd={() => openForm('authors', null)}
              onEdit={(id) => openForm('authors', id)}
            />
          )}
          {view === 'author_form' && (
            <AuthorForm
              authorId={editingAuthorId}
              onCancel={openAuthors}
              onSaved={() => {
                setMessage(t('admin.authors.saved'));
                openAuthors();
              }}
            />
          )}
          {view === 'categories' && (
            <CategoriesList
              notice={message}
              onAdd={() => openForm('categories', null)}
              onEdit={(id) => openForm('categories', id)}
            />
          )}
          {view === 'category_form' && (
            <CategoryForm
              categoryId={editingCategoryId}
              onCancel={openCategories}
              onSaved={() => {
                setMessage(t('admin.categories.saved'));
                openCategories();
              }}
            />
          )}
          {view === 'roles' && (
            <RolesList
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
                setMessage(t('admin.roles.saved'));
                openRoles();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
