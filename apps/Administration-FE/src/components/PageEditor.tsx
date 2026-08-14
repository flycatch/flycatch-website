import { useState } from 'react';
import { t } from '../lib/i18n';

interface Props {
  record: Record<string, unknown>;
  onSaveDraft: (draft: Record<string, unknown>) => Promise<void>;
  onPublish: () => Promise<void>;
}

export default function PageEditor({ record, onSaveDraft, onPublish }: Props) {
  const draft = (record.draft || {}) as Record<string, unknown>;
  const seo = (draft.seo || {}) as Record<string, unknown>;
  const [title, setTitle] = useState(String(seo.title || ''));
  const [description, setDescription] = useState(String(seo.description || ''));
  const [heading, setHeading] = useState(String(seo.primary_heading || ''));
  const [summary, setSummary] = useState(String(seo.summary || ''));
  const [body, setBody] = useState(String(draft.body || ''));

  async function saveDraft() {
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
  }

  return (
    <section>
      <h2>{t('admin.workspace.home_page')}</h2>
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
