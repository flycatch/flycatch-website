import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  bulkAssignUsers,
  createUser,
  listAllRoles,
  listUsers,
  updateUser,
  type UserList,
  type UserSummary,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import MultiSelect from './MultiSelect';

type RoleOption = { id: string; name: string };

interface Props {
  notice: string | null;
  currentEmail: string;
}

type DialogState = { mode: 'create' } | { mode: 'edit'; user: UserSummary } | null;

function initialRoleFilter(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('role_id') ?? '';
}

export default function UsersList({ notice, currentEmail }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserList | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await listUsers({
        q: appliedQuery,
        page,
        roleId: roleFilter,
        status: statusFilter,
      });
      if (result.items.length === 0 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }
      setData(result);
    } catch (caught) {
      setError(apiErrorMessage(caught, 'admin.workspace.load_failed'));
    }
  }, [appliedQuery, page, roleFilter, statusFilter]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    setSelected(new Set());
  }, [appliedQuery, page, roleFilter, statusFilter]);

  useEffect(() => {
    listAllRoles()
      .then((items) => setRoles(items.map((role) => ({ id: role.id, name: role.name }))))
      .catch(() => setError(t('admin.workspace.load_failed')));
  }, []);

  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((user) => selected.has(user.id));
  const headerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.indeterminate = selected.size > 0 && !allSelected;
    }
  }, [selected, allSelected]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(query.trim());
  }

  function toggleRow(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((user) => user.id)));
  }

  async function bulk(action: 'add' | 'remove') {
    if (!bulkRole || selected.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const result = await bulkAssignUsers({
        role_id: bulkRole,
        user_ids: [...selected],
        action,
      });
      setMessage(`${t('admin.users.bulk.done')}: ${result.changed}`);
      setSelected(new Set());
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: UserSummary) {
    setBusy(true);
    setError(null);
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      setMessage(t('admin.users.saved'));
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1;
  const loading = data === null && !error;

  return (
    <section className="roles-page users-page">
      <div className="roles-toolbar">
        <h2>{t('admin.users.title')}</h2>
        <button type="button" className="primary" onClick={() => setDialog({ mode: 'create' })}>
          {t('admin.users.add')}
        </button>
      </div>
      {(message || notice) && (
        <p role="status" className="roles-notice">
          {message || notice}
        </p>
      )}
      <form className="roles-search users-filters" onSubmit={search} role="search">
        <label>
          {t('admin.users.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.users.filter.role')}
          <select
            value={roleFilter}
            onChange={(event) => {
              setPage(1);
              setRoleFilter(event.target.value);
            }}
          >
            <option value="">{t('admin.users.filter.role_all')}</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('admin.users.filter.status')}
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
          >
            <option value="">{t('admin.users.filter.status_all')}</option>
            <option value="active">{t('admin.users.status.active')}</option>
            <option value="inactive">{t('admin.users.status.inactive')}</option>
          </select>
        </label>
        <button type="submit">{t('admin.roles.search.submit')}</button>
      </form>
      {error && (
        <p className="alert alert-error error" role="alert">
          {error}
        </p>
      )}
      {selected.size > 0 && (
        <div className="users-bulk" role="region" aria-label={t('admin.users.bulk.role')}>
          <strong>
            {selected.size} {t('admin.users.selected')}
          </strong>
          <select
            value={bulkRole}
            onChange={(event) => setBulkRole(event.target.value)}
            aria-label={t('admin.users.bulk.role')}
          >
            <option value="">{t('admin.users.bulk.pick')}</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button type="button" disabled={!bulkRole || busy} onClick={() => bulk('add')}>
            {t('admin.users.bulk.add')}
          </button>
          <button type="button" disabled={!bulkRole || busy} onClick={() => bulk('remove')}>
            {t('admin.users.bulk.remove')}
          </button>
        </div>
      )}
      <div className="roles-table-wrap" aria-busy={loading}>
        <table className="roles-table users-table">
          <thead>
            <tr>
              <th scope="col" className="table-select">
                <input
                  ref={headerRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label={t('admin.users.select_all')}
                />
              </th>
              <th scope="col">{t('admin.users.email')}</th>
              <th scope="col">{t('admin.users.roles')}</th>
              <th scope="col">{t('admin.users.status')}</th>
              <th scope="col">{t('admin.users.added_by')}</th>
              <th scope="col">{t('admin.users.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id}>
                <td className="table-select">
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    onChange={() => toggleRow(user.id)}
                    aria-label={`${t('admin.users.select')} ${user.email}`}
                  />
                </td>
                <td data-label={t('admin.users.email')}>{user.email}</td>
                <td data-label={t('admin.users.roles')}>
                  {user.roles.length > 0 ? (
                    <ul className="chip-list">
                      {user.roles.map((role) => (
                        <li key={role.id} className="chip">
                          {role.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="hint">{t('admin.users.no_role')}</span>
                  )}
                </td>
                <td data-label={t('admin.users.status')}>
                  <span className={user.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                    {user.is_active
                      ? t('admin.users.status.active')
                      : t('admin.users.status.inactive')}
                  </span>
                </td>
                <td data-label={t('admin.users.added_by')}>{user.created_by}</td>
                <td data-label={t('admin.users.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => setDialog({ mode: 'edit', user })}>
                    {t('admin.users.edit_action')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || (user.is_active && user.email === currentEmail)}
                    title={
                      user.is_active && user.email === currentEmail
                        ? t('admin.users.self_protected')
                        : undefined
                    }
                    onClick={() => toggleActive(user)}
                  >
                    {user.is_active ? t('admin.users.deactivate') : t('admin.users.activate')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <p className="loading-state" role="status">
            <span className="spinner" aria-hidden="true" />
            {t('admin.workspace.loading')}
          </p>
        )}
        {data && items.length === 0 && (
          <p className="roles-empty empty-state">{t('admin.users.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.users.title')}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {t('admin.roles.previous')}
          </button>
          <p>
            {t('admin.roles.page')} {data.page} / {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('admin.roles.next')}
          </button>
        </nav>
      )}
      {dialog && (
        <UserDialog
          state={dialog}
          roles={roles}
          isSelf={dialog.mode === 'edit' && dialog.user.email === currentEmail}
          onClose={() => setDialog(null)}
          onSaved={async (text) => {
            setDialog(null);
            setMessage(text);
            await load();
          }}
        />
      )}
    </section>
  );
}

function UserDialog({
  state,
  roles,
  isSelf,
  onClose,
  onSaved,
}: {
  state: NonNullable<DialogState>;
  roles: RoleOption[];
  isSelf: boolean;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const editing = state.mode === 'edit' ? state.user : null;
  const [email, setEmail] = useState(editing?.email ?? '');
  const [roleIds, setRoleIds] = useState<string[]>(editing?.roles.map((role) => role.id) ?? []);
  const [active, setActive] = useState(editing?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const options = useMemo(() => roles, [roles]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateUser(editing.id, { role_ids: roleIds, is_active: active });
        await onSaved(t('admin.users.saved'));
      } else {
        await createUser({ email: email.trim(), role_ids: roleIds });
        await onSaved(t('admin.users.created'));
      }
    } catch (caught) {
      setError(apiErrorMessage(caught));
      setSaving(false);
    }
  }

  return (
    <dialog ref={ref} className="roles-dialog users-dialog" onClose={onClose}>
      <form onSubmit={submit}>
        <h3>{editing ? t('admin.users.edit') : t('admin.users.add')}</h3>
        {!editing && <p className="hint">{t('admin.users.add_hint')}</p>}
        <label>
          {t('admin.users.email')}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={Boolean(editing)}
            required
            autoComplete="off"
          />
        </label>
        <MultiSelect
          id="user-roles"
          label={t('admin.users.roles')}
          options={options}
          selectedIds={roleIds}
          onChange={setRoleIds}
        />
        {editing && (
          <label className="permission-check">
            <input
              type="checkbox"
              checked={active}
              disabled={isSelf}
              onChange={(event) => setActive(event.target.checked)}
            />
            <span>{t('admin.users.status.active')}</span>
          </label>
        )}
        {error && (
          <p className="alert alert-error error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="button" onClick={() => ref.current?.close()} disabled={saving}>
            {t('admin.users.cancel')}
          </button>
          <button type="submit" className="primary" disabled={saving} aria-busy={saving}>
            {t('admin.users.save')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
