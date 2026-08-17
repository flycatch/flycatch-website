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
import SignInForm from './SignInForm';
import SiteSettingsEditor from './SiteSettingsEditor';

type View = 'site_settings' | 'home';

export default function AdminShell() {
  const [view, setView] = useState<View>('site_settings');
  const [session, setSession] = useState<SessionContext | null>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown> | null>(null);
  const [homePage, setHomePage] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [ready, setReady] = useState(!hasTokens());

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
  }

  if (!ready) {
    return (
      <main id="main" className="container">
        <p>{t('admin.workspace.title')}</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main id="main" className="container">
        <SignInForm onSignedIn={handleSignedIn} />
      </main>
    );
  }

  if (!siteSettings || !homePage) {
    return (
      <main id="main" className="container">
        <p role="alert">{workspaceError || t('admin.workspace.load_failed')}</p>
        <button type="button" onClick={handleSignOut}>
          {t('admin.sign_out')}
        </button>
      </main>
    );
  }

  const canDraft = hasPermission(session, 'drafts.save');
  const canPublish = hasPermission(session, 'records.publish');

  return (
    <div>
      <header className="admin-header">
        <div className="container">
          <h1>{t('admin.workspace.title')}</h1>
          <p>{session.email}</p>
          <button type="button" onClick={handleSignOut}>
            {t('admin.sign_out')}
          </button>
        </div>
      </header>
      <div className="admin-body container">
        <nav className="admin-nav" aria-label="Administration">
          <ul>
            <li>
              <button
                type="button"
                className={view === 'site_settings' ? 'active' : ''}
                aria-current={view === 'site_settings' ? 'page' : undefined}
                onClick={() => setView('site_settings')}
              >
                {t('admin.workspace.site_settings')}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={view === 'home' ? 'active' : ''}
                aria-current={view === 'home' ? 'page' : undefined}
                onClick={() => setView('home')}
              >
                {t('admin.workspace.home_page')}
              </button>
            </li>
          </ul>
        </nav>
        <main id="main" className="admin-main">
          {message && <p role="status">{message}</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {view === 'site_settings' && (
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
          {view === 'home' && (
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
        </main>
      </div>
    </div>
  );
}
