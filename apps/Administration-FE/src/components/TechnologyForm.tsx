import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createTechnology,
  getTechnology,
  updateTechnology,
  uploadMedia,
  type TechnologyWrite,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';
import MediaField from './MediaField';

interface Props {
  technologyId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';

export default function TechnologyForm({ technologyId, onCancel, onSaved }: Props) {
  const [name, setName] = useState('');
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('draft');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!technologyId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!technologyId) {
      setName('');
      setLogoKey(null);
      setLogoFile(null);
      setStatus('draft');
      setReady(true);
      return;
    }
    getTechnology(technologyId)
      .then((technology) => {
        setName(technology.name);
        setLogoKey(technology.logo_key);
        setStatus(technology.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [technologyId]);

  async function persist(nextStatus: Status) {
    setError(null);
    setFieldError(null);
    if (!name.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    setSaving(true);
    try {
      let nextLogoKey = logoKey;
      if (logoFile) {
        nextLogoKey = (await uploadMedia(logoFile)).key;
      }
      const payload: TechnologyWrite = {
        name: name.trim(),
        logo_key: nextLogoKey,
        status: nextStatus,
      };
      if (technologyId) await updateTechnology(technologyId, payload);
      else await createTechnology(payload);
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
        title={technologyId ? t('admin.technologies.edit') : t('admin.technologies.add')}
        onBack={onCancel}
        disabled={saving}
      />
      <form onSubmit={save}>
        <label>
          {t('admin.technologies.name')}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
            autoComplete="off"
            aria-invalid={Boolean(fieldError)}
          />
        </label>
        <MediaField
          label={t('admin.technologies.logo')}
          alt={name || t('admin.technologies.logo')}
          storedKey={logoKey}
          file={logoFile}
          onFile={setLogoFile}
          onClear={() => {
            setLogoFile(null);
            setLogoKey(null);
          }}
        />
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
            {t('admin.technologies.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.technologies.save')}
          </button>
          {status === 'publish' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft').catch(() => undefined)}
            >
              {t('admin.technologies.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.technologies.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
