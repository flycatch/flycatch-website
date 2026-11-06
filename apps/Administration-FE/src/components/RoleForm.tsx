import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AdminApiError,
  apiErrorMessage,
  bulkAssignUsers,
  createRole,
  getRole,
  getRoleCatalogue,
  listAllUsers,
  listRoleUsers,
  updateRole,
  type RoleCatalogue,
  type RoleWrite,
} from '../lib/admin-api';
import { NAV_GROUPS, navGroupIdForResource } from '../lib/admin-nav';
import { resourceLabel, t } from '../lib/i18n';
import FormPageHeader from './FormPageHeader';
import MultiSelect from './MultiSelect';

interface Props {
  roleId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

function permissionKey(resourceId: string, action: string): string {
  return `${resourceId}.${action}`;
}

const GROUP_ORDER = [...NAV_GROUPS.map((group) => group.id), 'other'];

function groupLabel(id: string): string {
  return id === 'other' ? t('admin.nav.group.other') : t(`admin.nav.group.${id}`);
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
  const [filter, setFilter] = useState('');
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [initialMemberIds, setInitialMemberIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const nextCatalogue = await getRoleCatalogue();
      setCatalogue(nextCatalogue);
      const users = await listAllUsers();
      setUserOptions(users.map((user) => ({ id: user.id, name: user.email })));
      if (roleId) {
        const members = (await listRoleUsers(roleId)).map((user) => user.id);
        setMemberIds(members);
        setInitialMemberIds(members);
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
        setMemberIds([]);
        setInitialMemberIds([]);
      }
      setReady(true);
    }
    load().catch(() => {
      setError(t('admin.workspace.load_failed'));
      setReady(true);
    });
  }, [roleId]);

  const actions = catalogue?.actions || [];

  function setCells(cells: [string, string][], on: boolean) {
    setGrants((current) => {
      const next = new Set(current);
      for (const [resourceId, action] of cells) {
        const key = permissionKey(resourceId, action);
        if (on) {
          next.add(key);
          // Any write action needs Read to be usable.
          if (action !== 'read') next.add(permissionKey(resourceId, 'read'));
        } else {
          next.delete(key);
          // Removing Read removes everything that depends on it.
          if (action === 'read') {
            for (const other of actions) next.delete(permissionKey(resourceId, other));
          }
        }
      }
      return next;
    });
  }

  function toggle(resourceId: string, action: string) {
    setCells([[resourceId, action]], !grants.has(permissionKey(resourceId, action)));
  }

  const visibleGroups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const resources = (catalogue?.resources || []).filter(
      (resource) =>
        !needle ||
        resourceLabel(resource.id).toLowerCase().includes(needle) ||
        resource.id.toLowerCase().includes(needle),
    );
    return GROUP_ORDER.map((id) => ({
      id,
      resources: resources.filter((resource) => navGroupIdForResource(resource.id) === id),
    })).filter((group) => group.resources.length > 0);
  }, [catalogue, filter]);

  const allCells: [string, string][] = (catalogue?.resources || []).flatMap(
    (resource) => actions.map((action): [string, string] => [resource.id, action]),
  );
  const grantedCount = allCells.filter(([r, a]) => grants.has(permissionKey(r, a))).length;
  const visibleCells = visibleGroups.flatMap((group) =>
    group.resources.flatMap((resource) =>
      actions.map((action): [string, string] => [resource.id, action]),
    ),
  );
  const allVisibleOn =
    visibleCells.length > 0 && visibleCells.every(([r, a]) => grants.has(permissionKey(r, a)));

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
      const saved = roleId ? await updateRole(roleId, payload) : await createRole(payload);
      const added = memberIds.filter((id) => !initialMemberIds.includes(id));
      const removed = initialMemberIds.filter((id) => !memberIds.includes(id));
      if (added.length > 0) {
        await bulkAssignUsers({ role_id: saved.id, user_ids: added, action: 'add' });
      }
      if (removed.length > 0) {
        await bulkAssignUsers({ role_id: saved.id, user_ids: removed, action: 'remove' });
      }
      onSaved();
    } catch (caught) {
      if (caught instanceof AdminApiError) {
        const detail = caught.detail as {
          message_key?: string;
          fields?: Record<string, { message_key: string }>;
        };
        const nameKey = detail.fields?.name?.message_key;
        const permissionKeyMessage = detail.fields?.permissions?.message_key;
        const detailKey = nameKey || permissionKeyMessage || detail.message_key;
        setError(detailKey ? t(detailKey) : apiErrorMessage(caught, 'admin.action.forbidden'));
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
          <div className="permission-toolbar">
            <label className="permission-filter">
              {t('admin.roles.filter')}
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                autoComplete="off"
              />
            </label>
            <p className="permission-summary" role="status">
              <strong>{grantedCount}</strong> {t('admin.roles.summary_of')} {allCells.length}{' '}
              {t('admin.roles.summary')}
            </p>
            <button
              type="button"
              onClick={() => setCells(visibleCells, !allVisibleOn)}
              disabled={visibleCells.length === 0}
            >
              {allVisibleOn ? t('admin.roles.clear_all') : t('admin.roles.select_all')}
            </button>
          </div>
          <p className="hint">{t('admin.roles.read_implied')}</p>
          <div className="permission-table-wrap">
            <table className="permission-table">
              <thead>
                <tr>
                  <th scope="col">{t('admin.roles.resource_col')}</th>
                  {actions.map((action) => {
                    const columnCells = visibleCells.filter(([, a]) => a === action);
                    const columnOn =
                      columnCells.length > 0 &&
                      columnCells.every(([r, a]) => grants.has(permissionKey(r, a)));
                    return (
                      <th key={action} scope="col" title={t(`admin.roles.action_help.${action}`)}>
                        <label className="permission-check permission-column">
                          <input
                            type="checkbox"
                            checked={columnOn}
                            disabled={columnCells.length === 0}
                            onChange={() => setCells(columnCells, !columnOn)}
                            aria-label={`${t('admin.roles.column_all')}: ${t(`admin.roles.action.${action}`)}`}
                          />
                          <span>{t(`admin.roles.action.${action}`)}</span>
                        </label>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              {visibleGroups.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={actions.length + 1}>{t('admin.roles.no_match')}</td>
                  </tr>
                </tbody>
              )}
              {visibleGroups.map((group) => {
                const groupCells = group.resources.flatMap((resource) =>
                  actions.map((action): [string, string] => [resource.id, action]),
                );
                const groupOn = groupCells.every(([r, a]) => grants.has(permissionKey(r, a)));
                return (
                  <tbody key={group.id} className="permission-group">
                    <tr className="permission-group-row">
                      <th scope="colgroup" colSpan={actions.length + 1}>
                        <label className="permission-check">
                          <input
                            type="checkbox"
                            checked={groupOn}
                            onChange={() => setCells(groupCells, !groupOn)}
                            aria-label={`${t('admin.roles.group_all')}: ${groupLabel(group.id)}`}
                          />
                          <span>{groupLabel(group.id)}</span>
                        </label>
                      </th>
                    </tr>
                    {group.resources.map((resource) => {
                      const rowCells = actions.map((action): [string, string] => [
                        resource.id,
                        action,
                      ]);
                      const rowOn = rowCells.every(([r, a]) => grants.has(permissionKey(r, a)));
                      return (
                        <tr key={resource.id}>
                          <th scope="row">
                            <label className="permission-check">
                              <input
                                type="checkbox"
                                checked={rowOn}
                                onChange={() => setCells(rowCells, !rowOn)}
                                aria-label={`${t('admin.roles.row_all')}: ${resourceLabel(resource.id)}`}
                              />
                              <span>{resourceLabel(resource.id)}</span>
                            </label>
                          </th>
                          {actions.map((action) => {
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
                      );
                    })}
                  </tbody>
                );
              })}
            </table>
          </div>
        </fieldset>
        <fieldset className="role-members">
          <legend>{t('admin.roles.assigned_users')}</legend>
          <p className="hint">{t('admin.roles.assigned_users_hint')}</p>
          <MultiSelect
            id="role-members"
            label={t('admin.roles.assigned_users_label')}
            options={userOptions}
            selectedIds={memberIds}
            onChange={setMemberIds}
          />
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
