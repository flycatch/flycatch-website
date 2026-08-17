import { useEffect, useState, type FormEvent } from 'react';
import { apiErrorMessage, createAuthor, getAuthor, updateAuthor } from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  authorId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

export default function AuthorForm({ authorId, onCancel, onSaved }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!authorId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authorId) {
      setName('');
      setReady(true);
      return;
    }
    getAuthor(authorId)
      .then((author) => {
        setName(author.name);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [authorId]);

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
      if (authorId) await updateAuthor(authorId, { name: name.trim() });
      else await createAuthor({ name: name.trim() });
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
        <h2>{authorId ? t('admin.authors.edit') : t('admin.authors.add')}</h2>
      </div>
      <form onSubmit={save}>
        <label>
          {t('admin.authors.name')}
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
            {t('admin.authors.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.authors.save')}
          </button>
        </div>
      </form>
    </section>
  );
}
