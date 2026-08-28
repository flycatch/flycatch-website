import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createCategory,
  getCategory,
  updateCategory,
  type CategoryWrite,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';

interface Props {
  categoryId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';

export default function CategoryForm({ categoryId, onCancel, onSaved }: Props) {
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
    getCategory(categoryId)
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
      const payload: CategoryWrite = { name: name.trim(), status: nextStatus };
      if (categoryId) await updateCategory(categoryId, payload);
      else await createCategory(payload);
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
      <FormPageHeader
        title={categoryId ? t('admin.categories.edit') : t('admin.categories.add')}
        onBack={onCancel}
        disabled={saving}
      />
      <form onSubmit={save}>
        <label>
          {t('admin.categories.name')}
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
            {t('admin.categories.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.categories.save')}
          </button>
          {status === 'publish' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft').catch(() => undefined)}
            >
              {t('admin.categories.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.categories.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
