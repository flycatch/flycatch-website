import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteClientLogo,
  listClientLogos,
  type ClientLogoList,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
import TableLogo from './TableLogo';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function ClientLogosList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ClientLogoList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      const result = await listClientLogos(nextQuery, nextPage);
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
      await deleteClientLogo(pendingId);
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
        <h2>{t('admin.client_logos.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.client_logos.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t('admin.client_logos.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t('admin.client_logos.search.submit')}</button>
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
              <th scope="col">{t('admin.client_logos.id')}</th>
              <th scope="col">{t('admin.client_logos.colour_logo')}</th>
              <th scope="col">{t('admin.client_logos.white_logo')}</th>
              <th scope="col">{t('admin.client_logos.alt_text')}</th>
              <th scope="col">{t('admin.client_logos.state')}</th>
              <th scope="col">{t('admin.client_logos.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <td data-label={t('admin.client_logos.id')}>
                  {(data.page - 1) * data.per_page + index + 1}
                </td>
                <td data-label={t('admin.client_logos.colour_logo')}>
                  <TableLogo mediaKey={item.colour_logo_key} alt={item.alt_text} />
                </td>
                <td data-label={t('admin.client_logos.white_logo')}>
                  <TableLogo mediaKey={item.white_logo_key} alt={item.alt_text} />
                </td>
                <td data-label={t('admin.client_logos.alt_text')}>{item.alt_text}</td>
                <td data-label={t('admin.client_logos.state')}>
                  {item.state === 'publish'
                    ? t('admin.client_logos.status.publish')
                    : t('admin.client_logos.status.draft')}
                </td>
                <td data-label={t('admin.client_logos.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t('admin.client_logos.edit_action')}
                  </button>
                  <button type="button" className="danger" onClick={() => openDelete(item.id)}>
                    {t('admin.client_logos.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.client_logos.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.client_logos.title')}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {t('admin.client_logos.previous')}
          </button>
          <p>
            {t('admin.client_logos.page')} {data.page} / {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('admin.client_logos.next')}
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
          <h3>{t('admin.client_logos.delete.confirm')}</h3>
          <p>{t('admin.client_logos.delete.confirm_body')}</p>
          <div className="actions">
            <button type="button" onClick={closeDelete}>
              {t('admin.client_logos.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.client_logos.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
