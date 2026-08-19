import { useCallback, useEffect, useState } from 'react';
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

type View =
  | 'site_settings'
  | 'home'
  | 'blogs'
  | 'blog_form'
  | 'case_studies'
  | 'case_study_form'
  | 'industries'
  | 'industry_form'
  | 'case_study_categories'
  | 'case_study_category_form'
  | 'authors'
  | 'author_form'
  | 'categories'
  | 'category_form'
  | 'roles'
  | 'role_form';

function canManageRolesFrom(session: SessionContext | null): boolean {
  return (
    hasPermission(session, 'roles.manage') || Boolean(session?.roles?.includes('administrator'))
  );
}

export default function AdminShell() {
  const [view, setView] = useState<View>('site_settings');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [editingCaseStudyId, setEditingCaseStudyId] = useState<string | null>(null);
  const [editingIndustryId, setEditingIndustryId] = useState<string | null>(null);
  const [editingCaseStudyCategoryId, setEditingCaseStudyCategoryId] = useState<string | null>(null);
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionContext | null>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown> | null>(null);
  const [homePage, setHomePage] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [ready, setReady] = useState(!hasTokens());
  const [navOpen, setNavOpen] = useState(false);

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
        setView('roles');
      }
    } finally {
      setReady(true);
    }
  }, []);

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
    setView('site_settings');
    setEditingRoleId(null);
    setEditingBlogId(null);
    setEditingCaseStudyId(null);
    setEditingIndustryId(null);
    setEditingCaseStudyCategoryId(null);
    setEditingAuthorId(null);
    setEditingCategoryId(null);
    setNavOpen(false);
  }

  function openRoles() {
    setView('roles');
    setEditingRoleId(null);
    setError(null);
    setNavOpen(false);
  }

  function openBlogs() {
    setView('blogs');
    setEditingBlogId(null);
    setError(null);
    setNavOpen(false);
  }

  function openCaseStudies() {
    setView('case_studies');
    setEditingCaseStudyId(null);
    setError(null);
    setNavOpen(false);
  }

  function openIndustries() {
    setView('industries');
    setEditingIndustryId(null);
    setError(null);
    setNavOpen(false);
  }

  function openCaseStudyCategories() {
    setView('case_study_categories');
    setEditingCaseStudyCategoryId(null);
    setError(null);
    setNavOpen(false);
  }

  function openAuthors() {
    setView('authors');
    setEditingAuthorId(null);
    setError(null);
    setNavOpen(false);
  }

  function openCategories() {
    setView('categories');
    setEditingCategoryId(null);
    setError(null);
    setNavOpen(false);
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
              <button
                type="button"
                className={view === 'site_settings' ? 'active' : ''}
                aria-current={view === 'site_settings' ? 'page' : undefined}
                onClick={() => {
                  setView('site_settings');
                  setNavOpen(false);
                }}
              >
                {t('admin.workspace.site_settings')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={view === 'home' ? 'active' : ''}
                aria-current={view === 'home' ? 'page' : undefined}
                onClick={() => {
                  setView('home');
                  setNavOpen(false);
                }}
              >
                {t('admin.workspace.home_page')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={view === 'blogs' || view === 'blog_form' ? 'active' : ''}
                aria-current={view === 'blogs' || view === 'blog_form' ? 'page' : undefined}
                onClick={openBlogs}
              >
                {t('admin.workspace.blogs')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={view === 'case_studies' || view === 'case_study_form' ? 'active' : ''}
                aria-current={
                  view === 'case_studies' || view === 'case_study_form' ? 'page' : undefined
                }
                onClick={openCaseStudies}
              >
                {t('admin.workspace.case_studies')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={view === 'industries' || view === 'industry_form' ? 'active' : ''}
                aria-current={view === 'industries' || view === 'industry_form' ? 'page' : undefined}
                onClick={openIndustries}
              >
                {t('admin.workspace.industries')}
              </button>
            </li>
            <li>
              <button
                type="button"
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
                onClick={openCaseStudyCategories}
              >
                {t('admin.workspace.case_study_categories')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={view === 'authors' || view === 'author_form' ? 'active' : ''}
                aria-current={view === 'authors' || view === 'author_form' ? 'page' : undefined}
                onClick={openAuthors}
              >
                {t('admin.workspace.authors')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={view === 'categories' || view === 'category_form' ? 'active' : ''}
                aria-current={view === 'categories' || view === 'category_form' ? 'page' : undefined}
                onClick={openCategories}
              >
                {t('admin.workspace.categories')}
              </button>
            </li>
            {canManageRoles && (
              <li>
                <button
                  type="button"
                  className={settingsCurrent ? 'active' : ''}
                  aria-current={settingsCurrent ? 'page' : undefined}
                  onClick={openRoles}
                >
                  {t('admin.workspace.settings')}
                </button>
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
              onAdd={() => {
                setEditingBlogId(null);
                setMessage(null);
                setView('blog_form');
              }}
              onEdit={(id) => {
                setEditingBlogId(id);
                setMessage(null);
                setView('blog_form');
              }}
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
              onAdd={() => {
                setEditingCaseStudyId(null);
                setMessage(null);
                setView('case_study_form');
              }}
              onEdit={(id) => {
                setEditingCaseStudyId(id);
                setMessage(null);
                setView('case_study_form');
              }}
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
              onAdd={() => {
                setEditingIndustryId(null);
                setMessage(null);
                setView('industry_form');
              }}
              onEdit={(id) => {
                setEditingIndustryId(id);
                setMessage(null);
                setView('industry_form');
              }}
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
              onAdd={() => {
                setEditingCaseStudyCategoryId(null);
                setMessage(null);
                setView('case_study_category_form');
              }}
              onEdit={(id) => {
                setEditingCaseStudyCategoryId(id);
                setMessage(null);
                setView('case_study_category_form');
              }}
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
          {view === 'authors' && (
            <AuthorsList
              notice={message}
              onAdd={() => {
                setEditingAuthorId(null);
                setMessage(null);
                setView('author_form');
              }}
              onEdit={(id) => {
                setEditingAuthorId(id);
                setMessage(null);
                setView('author_form');
              }}
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
              onAdd={() => {
                setEditingCategoryId(null);
                setMessage(null);
                setView('category_form');
              }}
              onEdit={(id) => {
                setEditingCategoryId(id);
                setMessage(null);
                setView('category_form');
              }}
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
              onAdd={() => {
                setEditingRoleId(null);
                setMessage(null);
                setView('role_form');
              }}
              onEdit={(id) => {
                setEditingRoleId(id);
                setMessage(null);
                setView('role_form');
              }}
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
