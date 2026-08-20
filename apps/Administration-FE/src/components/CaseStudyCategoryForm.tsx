import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createCaseStudyCategory,
  getCaseStudyCategory,
  updateCaseStudyCategory,
  type CaseStudyCategoryWrite,
} from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  categoryId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';

export default function CaseStudyCategoryForm({ categoryId, onCancel, onSaved }: Props) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!categoryId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setName('');
      setStatus('draft');
      setReady(true);
      return;
    }
    getCaseStudyCategory(categoryId)
      .then((category) => {
        setName(category.name);
        setStatus(category.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [categoryId]);

  async function persist(nextStatus: Status) {
    setError(null);
    setFieldError(null);
    if (!name.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    setSaving(true);
    try {
      const payload: CaseStudyCategoryWrite = { name: name.trim(), status: nextStatus };
      if (categoryId) await updateCaseStudyCategory(categoryId, payload);
      else await createCaseStudyCategory(payload);
      onSaved();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    await persist(status);
  }

  if (!ready) {
    return (
      <section className="role-form-page">
        <p className="loading-state" role="status">
          <span className="spinner" aria-hidden="true" />
          {t('admin.workspace.loading')}
        </p>
      </section>
    );
  }

  return (
    <section className="role-form-page">
      <div className="panel-header">
        <h2>
          {categoryId
            ? t('admin.case_study_categories.edit')
            : t('admin.case_study_categories.add')}
        </h2>
      </div>
      <form onSubmit={save}>
        <label>
          {t('admin.case_study_categories.name')}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
            autoComplete="off"
            aria-invalid={Boolean(fieldError)}
          />
        </label>
        {fieldError && (
          <p className="alert alert-error error" role="alert">
            {fieldError}
          </p>
        )}
        {error && (
          <p className="alert alert-error error" role="alert">
            {error}
          </p>
        )}
        <div className="actions panel-footer">
          <button type="button" onClick={onCancel} disabled={saving}>
            {t('admin.case_study_categories.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.case_study_categories.save')}
          </button>
          {status === 'publish' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft').catch(() => undefined)}
            >
              {t('admin.case_study_categories.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.case_study_categories.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
