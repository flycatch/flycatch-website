import { useEffect, useState, type FormEvent } from 'react';
import {
  AdminApiError,
  createRole,
  getRole,
  getRoleCatalogue,
  updateRole,
  type RoleCatalogue,
  type RoleWrite,
} from '../lib/admin-api';
import { resourceLabel, t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';

interface Props {
  roleId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

function permissionKey(resourceId: string, action: string): string {
  return `${resourceId}.${action}`;
}

export default function RoleForm({ roleId, onCancel, onSaved }: Props) {
  const [catalogue, setCatalogue] = useState<RoleCatalogue | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [grants, setGrants] = useState<Set<string>>(new Set());
  const [isSystem, setIsSystem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const nextCatalogue = await getRoleCatalogue();
      setCatalogue(nextCatalogue);
      if (roleId) {
        const role = await getRole(roleId);
        setName(role.name);
        setDescription(role.description || '');
        setGrants(new Set(role.permissions));
        setIsSystem(role.is_system);
      } else {
        setName('');
        setDescription('');
        setGrants(new Set());
        setIsSystem(false);
      }
      setReady(true);
    }
    load().catch(() => {
      setError(t('admin.workspace.load_failed'));
      setReady(true);
    });
  }, [roleId]);

  function toggle(resourceId: string, action: string) {
    const key = permissionKey(resourceId, action);
    setGrants((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldError(null);
    if (!name.trim()) {
      setFieldError(t('admin.field.required'));
      return;
    }
    const allowed = new Set(
      (catalogue?.resources || []).flatMap((resource) =>
        (catalogue?.actions || []).map((action) => permissionKey(resource.id, action)),
      ),
    );
    const payload: RoleWrite = {
      name: name.trim(),
      description: description.trim() || null,
      permissions: [...grants].filter((item) => allowed.has(item)),
    };
    setSaving(true);
    try {
      if (roleId) await updateRole(roleId, payload);
      else await createRole(payload);
      onSaved();
    } catch (caught) {
      if (caught instanceof AdminApiError) {
        const detail = caught.detail as {
          message_key?: string;
          fields?: Record<string, { message_key: string }>;
        };
        const nameKey = detail.fields?.name?.message_key;
        const permissionKeyMessage = detail.fields?.permissions?.message_key;
        setError(t(nameKey || permissionKeyMessage || detail.message_key || 'admin.action.forbidden'));
        return;
      }
      setError(t('admin.action.forbidden'));
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
      <FormPageHeader
        title={roleId ? t('admin.roles.edit') : t('admin.roles.add')}
        onBack={onCancel}
        disabled={saving}
      />
      <form onSubmit={save}>
        <label>
          {t('admin.roles.name')}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={64}
            disabled={isSystem}
            autoComplete="off"
            aria-invalid={Boolean(fieldError)}
          />
        </label>
        {isSystem && <p className="hint">{t('admin.roles.system_protected')}</p>}
        <label>
          {t('admin.roles.description')}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={3}
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
        <fieldset className="permission-matrix">
          <legend>{t('admin.roles.permissions')}</legend>
          <div className="permission-table-wrap">
            <table className="permission-table">
              <thead>
                <tr>
                  <th scope="col">{t('admin.roles.name')}</th>
                  {(catalogue?.actions || []).map((action) => (
                    <th key={action} scope="col">
                      {t(`admin.roles.action.${action}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(catalogue?.resources || []).map((resource) => (
                  <tr key={resource.id}>
                    <th scope="row">{resourceLabel(resource.id)}</th>
                    {(catalogue?.actions || []).map((action) => {
                      const key = permissionKey(resource.id, action);
                      const inputId = `perm-${resource.id}-${action}`;
                      return (
                        <td key={action} data-label={t(`admin.roles.action.${action}`)}>
                          <label className="permission-check" htmlFor={inputId}>
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={grants.has(key)}
                              onChange={() => toggle(resource.id, action)}
                            />
                            <span className="permission-check-label">
                              {t(`admin.roles.action.${action}`)}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>
        <div className="actions panel-footer">
          <button type="button" onClick={onCancel} disabled={saving}>
            {t('admin.roles.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.roles.save')}
          </button>
        </div>
      </form>
    </section>
  );
}
