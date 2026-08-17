import { useState } from 'react';
import { t } from '../lib/i18n';

interface Props {
  record: Record<string, unknown>;
  canDraft: boolean;
  canPublish: boolean;
  onSaveDraft: (draft: Record<string, unknown>) => Promise<void>;
  onPublish: () => Promise<void>;
}

export default function PageEditor({
  record,
  canDraft,
  canPublish,
  onSaveDraft,
  onPublish,
}: Props) {
  const draft = (record.draft || {}) as Record<string, unknown>;
  const seo = (draft.seo || {}) as Record<string, unknown>;
  const [title, setTitle] = useState(String(seo.title || ''));
  const [description, setDescription] = useState(String(seo.description || ''));
  const [heading, setHeading] = useState(String(seo.primary_heading || ''));
  const [summary, setSummary] = useState(String(seo.summary || ''));
  const [body, setBody] = useState(String(draft.body || ''));
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null);

  async function saveDraft() {
    setBusy('draft');
    try {
      await onSaveDraft({
        ...draft,
        slug: 'home',
        body,
        seo: {
          ...seo,
          title,
          description,
          primary_heading: heading,
          summary,
          canonical_path: '/',
          indexable: true,
        },
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
        <h2>{t('admin.workspace.home_page')}</h2>
      </div>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
      </label>
      <label>
        Primary heading
        <input value={heading} onChange={(e) => setHeading(e.target.value)} required />
      </label>
      <label>
        Summary
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} required />
      </label>
      <label>
        Body
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
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
