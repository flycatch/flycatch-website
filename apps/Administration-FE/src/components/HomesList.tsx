import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteHome,
  listHomes,
  type HomeList,
} from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function HomesList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HomeList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      const result = await listHomes(nextQuery, nextPage);
      setData(result);
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }

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
      await deleteHome(pendingId);
      closeDelete();
      await load(appliedQuery, page);
    } catch (caught) {
      closeDelete();
      setError(apiErrorMessage(caught));
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1;
  const loading = data === null && !error;

  return (
    <section className="roles-page">
      <div className="roles-toolbar">
        <h2>{t('admin.homes.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.homes.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t('admin.homes.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t('admin.homes.search.submit')}</button>
      </form>
      {error && (
        <p className="alert alert-error error" role="alert">
          {error}
        </p>
      )}
      <div className="roles-table-wrap" aria-busy={loading}>
        <table className="roles-table">
          <thead>
            <tr>
              <th scope="col">{t('admin.homes.id')}</th>
              <th scope="col">{t('admin.homes.title.column')}</th>
              <th scope="col">{t('admin.homes.video_file')}</th>
              <th scope="col">{t('admin.homes.created_at')}</th>
              <th scope="col">{t('admin.homes.content_available_in')}</th>
              <th scope="col">{t('admin.homes.state')}</th>
              <th scope="col">{t('admin.homes.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <td data-label={t('admin.homes.id')}>
                  {(data.page - 1) * data.per_page + index + 1}
                </td>
                <td data-label={t('admin.homes.title.column')}>{item.title}</td>
                <td data-label={t('admin.homes.video_file')}>{item.video_format || '—'}</td>
                <td data-label={t('admin.homes.created_at')}>{formatCreatedAt(item.created_at)}</td>
                <td data-label={t('admin.homes.content_available_in')}>
                  {item.content_available_in}
                </td>
                <td data-label={t('admin.homes.state')}>
                  {item.state === 'publish'
                    ? t('admin.homes.status.publish')
                    : t('admin.homes.status.draft')}
                </td>
                <td data-label={t('admin.homes.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t('admin.homes.edit_action')}
                  </button>
                  <button type="button" className="danger" onClick={() => openDelete(item.id)}>
                    {t('admin.homes.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.homes.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.homes.title')}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {t('admin.homes.previous')}
          </button>
          <p>
            {t('admin.homes.page')} {data.page} / {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('admin.homes.next')}
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
          <h3>{t('admin.homes.delete.confirm')}</h3>
          <p>{t('admin.homes.delete.confirm_body')}</p>
          <div className="actions">
            <button type="button" onClick={closeDelete}>
              {t('admin.homes.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.homes.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
