import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createClientLogo,
  getClientLogo,
  updateClientLogo,
  uploadMedia,
  type ClientLogoWrite,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';
import MediaField from './MediaField';

interface Props {
  logoId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';

export default function ClientLogoForm({ logoId, onCancel, onSaved }: Props) {
  const [altText, setAltText] = useState('');
  const [colourKey, setColourKey] = useState<string | null>(null);
  const [whiteKey, setWhiteKey] = useState<string | null>(null);
  const [colourFile, setColourFile] = useState<File | null>(null);
  const [whiteFile, setWhiteFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('draft');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!logoId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!logoId) {
      setAltText('');
      setColourKey(null);
      setWhiteKey(null);
      setColourFile(null);
      setWhiteFile(null);
      setStatus('draft');
      setReady(true);
      return;
    }
    getClientLogo(logoId)
      .then((logo) => {
        setAltText(logo.alt_text);
        setColourKey(logo.colour_logo_key);
        setWhiteKey(logo.white_logo_key);
        setStatus(logo.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [logoId]);

  async function persist(nextStatus: Status) {
    setError(null);
    setFieldError(null);
    if (!altText.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    setSaving(true);
    try {
      let nextColour = colourKey;
      let nextWhite = whiteKey;
      if (colourFile) {
        nextColour = (await uploadMedia(colourFile)).key;
      }
      if (whiteFile) {
        nextWhite = (await uploadMedia(whiteFile)).key;
      }
      const payload: ClientLogoWrite = {
        alt_text: altText.trim(),
        colour_logo_key: nextColour,
        white_logo_key: nextWhite,
        status: nextStatus,
      };
      if (logoId) await updateClientLogo(logoId, payload);
      else await createClientLogo(payload);
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
        title={logoId ? t('admin.client_logos.edit') : t('admin.client_logos.add')}
        onBack={onCancel}
        disabled={saving}
      />
      <form onSubmit={save}>
        <MediaField
          label={t('admin.client_logos.colour_logo')}
          alt={altText || t('admin.client_logos.colour_logo')}
          storedKey={colourKey}
          file={colourFile}
          onFile={setColourFile}
          onClear={() => {
            setColourFile(null);
            setColourKey(null);
          }}
        />
        <MediaField
          label={t('admin.client_logos.white_logo')}
          alt={altText || t('admin.client_logos.white_logo')}
          storedKey={whiteKey}
          file={whiteFile}
          onFile={setWhiteFile}
          onClear={() => {
            setWhiteFile(null);
            setWhiteKey(null);
          }}
        />
        <label>
          {t('admin.client_logos.alt_text')}
          <input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            required
            maxLength={200}
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
            {t('admin.client_logos.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.client_logos.save')}
          </button>
          {status === 'publish' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft').catch(() => undefined)}
            >
              {t('admin.client_logos.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.client_logos.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
