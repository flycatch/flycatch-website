import { useEffect, useState, type FormEvent } from 'react';
import { apiErrorMessage, createAuthor, getAuthor, updateAuthor, uploadMedia } from '../lib/admin-api';
import { t } from '../lib/i18n';
import MediaPreview from './MediaPreview';

interface Props {
  authorId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

export default function AuthorForm({ authorId, onCancel, onSaved }: Props) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [designation, setDesignation] = useState('');
  const [writerImageKeys, setWriterImageKeys] = useState<string[]>([]);
  const [writerFiles, setWriterFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!authorId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authorId) {
      setName('');
      setBio('');
      setDesignation('');
      setWriterImageKeys([]);
      setWriterFiles([]);
      setReady(true);
      return;
    }
    getAuthor(authorId)
      .then((author) => {
        setName(author.name);
        setBio(author.bio);
        setDesignation(author.designation);
        setWriterImageKeys(author.writer_image_keys);
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
      const extraWriterKeys = [];
      for (const file of writerFiles) {
        extraWriterKeys.push((await uploadMedia(file)).key);
      }
      const payload = {
        name: name.trim(),
        bio: bio.trim(),
        designation: designation.trim(),
        writer_image_keys: [...writerImageKeys, ...extraWriterKeys],
      };
      if (authorId) await updateAuthor(authorId, payload);
      else await createAuthor(payload);
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
        <label>
          {t('admin.authors.bio')}
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} />
        </label>
        <label>
          {t('admin.authors.writer_images')}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => setWriterFiles(Array.from(event.target.files || []))}
          />
        </label>
        <MediaPreview
          mediaKeys={writerImageKeys}
          files={writerFiles}
          alt={t('admin.authors.writer_images')}
        />
        <label>
          {t('admin.authors.designation')}
          <input
            value={designation}
            onChange={(event) => setDesignation(event.target.value)}
            maxLength={200}
            autoComplete="off"
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
