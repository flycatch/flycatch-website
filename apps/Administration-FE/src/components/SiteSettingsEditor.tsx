import { useState } from 'react';
import { t } from '../lib/i18n';

interface Props {
  record: Record<string, unknown>;
  canDraft: boolean;
  canPublish: boolean;
  onSaveDraft: (draft: Record<string, unknown>) => Promise<void>;
  onPublish: () => Promise<void>;
}

export default function SiteSettingsEditor({
  record,
  canDraft,
  canPublish,
  onSaveDraft,
  onPublish,
}: Props) {
  const draft = (record.draft || {}) as Record<string, unknown>;
  const [siteName, setSiteName] = useState(String(draft.site_name || ''));
  const [canonicalOrigin, setCanonicalOrigin] = useState(String(draft.canonical_origin || ''));
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);

  async function saveDraft() {
    setBusy('draft');
    try {
      await onSaveDraft({
        ...draft,
        site_name: siteName,
        canonical_origin: canonicalOrigin,
        default_locale: 'en',
        locale_url_strategy: 'unprefixed_default',
        robots_policy: 'index_public',
        default_social_image_key: draft.default_social_image_key ?? null,
      });
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    setBusy('publish');
    try {
      await onPublish();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <div className="panel-header">
        <h2>{t('admin.workspace.site_settings')}</h2>
      </div>
      <label>
        Site name
        <input value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
      </label>
      <label>
        Canonical origin
        <input value={canonicalOrigin} onChange={(e) => setCanonicalOrigin(e.target.value)} required />
      </label>
      <div className="actions panel-footer">
        {canDraft && (
          <button
            type="button"
            onClick={saveDraft}
            disabled={busy !== null}
            aria-busy={busy === 'draft'}
          >
            {t('admin.save_draft')}
          </button>
        )}
        {canPublish ? (
          <button
            type="button"
            className="primary"
            onClick={publish}
            disabled={busy !== null}
            aria-busy={busy === 'publish'}
          >
            {t('admin.publish')}
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            disabled
            aria-disabled="true"
            title={t('admin.action.forbidden')}
          >
            {t('admin.publish')}
          </button>
        )}
      </div>
      {!canPublish && (
        <p className="alert alert-warning error" role="status">
          {t('admin.action.forbidden')}
        </p>
      )}
    </section>
  );
}
