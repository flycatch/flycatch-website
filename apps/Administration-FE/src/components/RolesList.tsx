import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AdminApiError,
  deleteRole,
  listRoles,
  type RoleList,
} from '../lib/admin-api';
import { applyPagedResult, useBulkTable } from '../lib/use-bulk-table';
import { t } from '../lib/i18n';
import {
  BulkActionsBar,
  BulkDeleteDialog,
  RowSelectCell,
  SelectAllHeader,
} from './BulkTableControls';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function RolesList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RoleList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      applyPagedResult(await listRoles(nextQuery, nextPage), nextPage, setPage, setData);
    } catch {
      setError(t('admin.workspace.load_failed'));
    }
  }

  const bulk = useBulkTable({
    ids: data?.items.map((item) => item.id) ?? [],
    resetKey: `/admin/roles:${page}:${appliedQuery}`,
    path: '/admin/roles',
    supportsUnpublish: false,
    canSelect: (id) => {
      const role = data?.items.find((item) => item.id === id);
      return Boolean(role) && !role?.is_system && (role?.user_count ?? 0) === 0;
    },
    onReload: () => load(appliedQuery, page),
    onError: setError,
  });

  useEffect(() => {
    load(appliedQuery, page).catch(() => undefined);
  }, [appliedQuery, page]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(query.trim());
  }

  function openDelete(id: string) {
    setPendingId(id);
    dialogRef.current?.showModal();
  }

  function closeDelete() {
    setPendingId(null);
    dialogRef.current?.close();
  }

  async function confirmDelete() {
    if (!pendingId) return;
    try {
      await deleteRole(pendingId);
      closeDelete();
      await load(appliedQuery, page);
    } catch (caught) {
      closeDelete();
      if (caught instanceof AdminApiError) {
        const detail = caught.detail as { message_key?: string };
        setError(t(detail.message_key || 'admin.action.forbidden'));
        return;
      }
      setError(t('admin.action.forbidden'));
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1;
  const loading = data === null && !error;

  return (
    <section className="roles-page">
      <div className="roles-toolbar">
        <h2>{t('admin.roles.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.roles.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t('admin.roles.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t('admin.roles.search.submit')}</button>
      </form>
      {error && (
        <p className="alert alert-error error" role="alert">
          {error}
        </p>
      )}
      <BulkActionsBar bulk={bulk} />
      <div className="roles-table-wrap" aria-busy={loading}>
        <table className="roles-table">
          <thead>
            <tr>
              <SelectAllHeader bulk={bulk} />
              <th scope="col">{t('admin.roles.name')}</th>
              <th scope="col">{t('admin.roles.description')}</th>
              <th scope="col">{t('admin.roles.users')}</th>
              <th scope="col">{t('admin.roles.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((role) => (
              <tr key={role.id}>
                <RowSelectCell bulk={bulk} id={role.id} />
                <td data-label={t('admin.roles.name')}>{role.name}</td>
                <td data-label={t('admin.roles.description')}>{role.description || '—'}</td>
                <td data-label={t('admin.roles.users')}>{role.user_count}</td>
                <td data-label={t('admin.roles.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(role.id)}>
                    {t('admin.roles.edit_action')}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={role.is_system || role.user_count > 0}
                    aria-disabled={role.is_system || role.user_count > 0}
                    title={
                      role.is_system
                        ? t('admin.roles.system_protected')
                        : role.user_count > 0
                          ? t('admin.roles.in_use')
                          : undefined
                    }
                    onClick={() => openDelete(role.id)}
                  >
                    {t('admin.roles.delete_action')}
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
        {data && data.items.length === 0 && (
          <p className="roles-empty empty-state">{t('admin.roles.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.roles.title')}>
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
      <dialog ref={dialogRef} className="roles-dialog" onClose={() => setPendingId(null)}>
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            confirmDelete().catch(() => undefined);
          }}
        >
          <h3>{t('admin.roles.delete.confirm')}</h3>
          <p>{t('admin.roles.delete.confirm_body')}</p>
          <div className="actions">
            <button type="button" onClick={closeDelete}>
              {t('admin.roles.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.roles.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
      <BulkDeleteDialog bulk={bulk} />
    </section>
  );
}
