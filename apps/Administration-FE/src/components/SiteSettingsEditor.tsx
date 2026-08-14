import { useState } from 'react';
import { t } from '../lib/i18n';

interface Props {
  record: Record<string, unknown>;
  onSaveDraft: (draft: Record<string, unknown>) => Promise<void>;
  onPublish: () => Promise<void>;
}

export default function SiteSettingsEditor({ record, onSaveDraft, onPublish }: Props) {
  const draft = (record.draft || {}) as Record<string, unknown>;
  const [siteName, setSiteName] = useState(String(draft.site_name || ''));
  const [canonicalOrigin, setCanonicalOrigin] = useState(String(draft.canonical_origin || ''));

  async function saveDraft() {
    await onSaveDraft({
      ...draft,
      site_name: siteName,
      canonical_origin: canonicalOrigin,
      default_locale: 'en',
      locale_url_strategy: 'unprefixed_default',
      robots_policy: 'index_public',
      default_social_image_key: draft.default_social_image_key ?? null,
    });
  }

  return (
    <section>
      <h2>{t('admin.workspace.site_settings')}</h2>
      <label>
        Site name
        <input value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
      </label>
      <label>
        Canonical origin
        <input value={canonicalOrigin} onChange={(e) => setCanonicalOrigin(e.target.value)} required />
      </label>
      <div className="actions">
        <button type="button" onClick={saveDraft}>
          {t('admin.save_draft')}
        </button>
        <button type="button" className="primary" onClick={onPublish}>
          {t('admin.publish')}
        </button>
      </div>
    </section>
  );
}
