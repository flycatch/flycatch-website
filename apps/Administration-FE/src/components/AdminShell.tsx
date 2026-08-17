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

type View = 'site_settings' | 'home' | 'roles' | 'role_form';

function canManageRolesFrom(session: SessionContext | null): boolean {
  return (
    hasPermission(session, 'roles.manage') || Boolean(session?.roles?.includes('administrator'))
  );
}

export default function AdminShell() {
  const [view, setView] = useState<View>('site_settings');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
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
    setNavOpen(false);
  }

  function openRoles() {
    setView('roles');
    setEditingRoleId(null);
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
          {message && view !== 'roles' && view !== 'role_form' && (
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
