import { useEffect, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  createIndustry,
  getIndustry,
  updateIndustry,
  type IndustryWrite,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';

interface Props {
  industryId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

type Status = 'draft' | 'publish';

export default function IndustryForm({ industryId, onCancel, onSaved }: Props) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(!industryId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!industryId) {
      setName('');
      setStatus('draft');
      setReady(true);
      return;
    }
    getIndustry(industryId)
      .then((industry) => {
        setName(industry.name);
        setStatus(industry.status);
        setReady(true);
      })
      .catch(() => {
        setError(t('admin.workspace.request_failed'));
        setReady(true);
      });
  }, [industryId]);

  async function persist(nextStatus: Status) {
    setError(null);
    setFieldError(null);
    if (!name.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    setSaving(true);
    try {
      const payload: IndustryWrite = { name: name.trim(), status: nextStatus };
      if (industryId) await updateIndustry(industryId, payload);
      else await createIndustry(payload);
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
        title={industryId ? t('admin.industries.edit') : t('admin.industries.add')}
        onBack={onCancel}
        disabled={saving}
      />
      <form onSubmit={save}>
        <label>
          {t('admin.industries.name')}
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
            {t('admin.industries.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.industries.save')}
          </button>
          {status === 'publish' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft').catch(() => undefined)}
            >
              {t('admin.industries.unpublish')}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('publish').catch(() => undefined)}
            >
              {t('admin.industries.publish')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
