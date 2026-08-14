import { useEffect, useState } from 'react';
import {
  getCsrfToken,
  getPageRecord,
  getSession,
  getSiteSettingsRecord,
  publishRecord,
  savePageDraft,
  saveSiteSettingsDraft,
  signOut,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import PageEditor from './PageEditor';
import SiteSettingsEditor from './SiteSettingsEditor';

type View = 'site_settings' | 'home';

export default function AdminShell() {
  const [view, setView] = useState<View>('site_settings');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [csrf, setCsrf] = useState<string>('');
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown> | null>(null);
  const [homePage, setHomePage] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const session = await getSession();
        setSessionEmail(session.email);
        const token = await getCsrfToken();
        setCsrf(token);
        const settings = await getSiteSettingsRecord();
        setSiteSettings(settings as Record<string, unknown>);
        const page = await getPageRecord('home');
        setHomePage(page as Record<string, unknown>);
      } catch {
        window.location.href = '/admin/sign-in';
      }
    }
    load();
  }, []);

  async function refreshData() {
    const settings = await getSiteSettingsRecord();
    setSiteSettings(settings as Record<string, unknown>);
    const page = await getPageRecord('home');
    setHomePage(page as Record<string, unknown>);
  }

  async function handleSignOut() {
    await signOut();
    window.location.href = '/admin/sign-in';
  }

  if (!sessionEmail || !siteSettings || !homePage) {
    return <p>{t('admin.workspace.title')}</p>;
  }

  return (
    <div>
      <header className="admin-header">
        <div className="container">
          <h1>{t('admin.workspace.title')}</h1>
          <p>{sessionEmail}</p>
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
              onSaveDraft={async (draft) => {
                await saveSiteSettingsDraft(draft, csrf);
                setMessage('Draft saved');
                await refreshData();
              }}
              onPublish={async () => {
                await publishRecord('site_settings', 'default', csrf);
                setMessage(t('admin.publish.success'));
                await refreshData();
              }}
            />
          )}
          {view === 'home' && (
            <PageEditor
              record={homePage}
              onSaveDraft={async (draft) => {
                await savePageDraft('home', draft, csrf);
                setMessage('Draft saved');
                await refreshData();
              }}
              onPublish={async () => {
                await publishRecord('page', 'home', csrf);
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
