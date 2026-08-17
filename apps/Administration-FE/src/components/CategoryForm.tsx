import { useEffect, useState, type FormEvent } from 'react';
import { apiErrorMessage, createCategory, getCategory, updateCategory } from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  categoryId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

export default function CategoryForm({ categoryId, onCancel, onSaved }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!categoryId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setName('');
      setReady(true);
      return;
    }
    getCategory(categoryId)
      .then((category) => {
        setName(category.name);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [categoryId]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldError(null);
    if (!name.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    setSaving(true);
    try {
      if (categoryId) await updateCategory(categoryId, { name: name.trim() });
      else await createCategory({ name: name.trim() });
      onSaved();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
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
        <h2>{categoryId ? t('admin.categories.edit') : t('admin.categories.add')}</h2>
      </div>
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
        </div>
      </form>
    </section>
  );
}
