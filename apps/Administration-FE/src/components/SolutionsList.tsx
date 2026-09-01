import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteSolution,
  listSolutions,
  type SolutionList,
} from '../lib/admin-api';
import { applyPagedResult, useBulkTable } from '../lib/use-bulk-table';
import { t } from '../lib/i18n';
import {
  BulkActionsBar,
  BulkDeleteDialog,
  RowSelectCell,
  SelectAllHeader,
} from './BulkTableControls';
import TableLogo from './TableLogo';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function SolutionsList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SolutionList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      applyPagedResult(await listSolutions(nextQuery, nextPage), nextPage, setPage, setData);
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }


  const bulk = useBulkTable({
    ids: data?.items.map((item) => item.id) ?? [],
    resetKey: `/admin/solutions:${page}:${appliedQuery}`,
    path: '/admin/solutions',
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

  async function confirmDelete() {
    if (!pendingId) return;
    try {
      await deleteSolution(pendingId);
      setPendingId(null);
      dialogRef.current?.close();
      await load(appliedQuery, page);
    } catch (caught) {
      dialogRef.current?.close();
      setPendingId(null);
      setError(apiErrorMessage(caught));
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1;
  const loading = data === null && !error;

  return (
    <section className="roles-page">
      <div className="roles-toolbar">
        <h2>{t('admin.solutions.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.solutions.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t('admin.solutions.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t('admin.solutions.search.submit')}</button>
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
              <th scope="col">{t('admin.solutions.id')}</th>
              <th scope="col">{t('admin.solutions.banner_image')}</th>
              <th scope="col">{t('admin.solutions.banner_title')}</th>
              <th scope="col">{t('admin.solutions.section_title')}</th>
              <th scope="col">{t('admin.solutions.state')}</th>
              <th scope="col">{t('admin.solutions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <RowSelectCell bulk={bulk} id={item.id} />
                <td data-label={t('admin.solutions.id')}>
                  {(data.page - 1) * data.per_page + index + 1}
                </td>
                <td data-label={t('admin.solutions.banner_image')}>
                  <TableLogo mediaKey={item.banner_image_key} alt={item.banner_title} />
                </td>
                <td data-label={t('admin.solutions.banner_title')}>{item.banner_title}</td>
                <td data-label={t('admin.solutions.section_title')}>{item.section_title}</td>
                <td data-label={t('admin.solutions.state')}>
                  {item.state === 'publish'
                    ? t('admin.solutions.status.publish')
                    : t('admin.solutions.status.draft')}
                </td>
                <td data-label={t('admin.solutions.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t('admin.solutions.edit_action')}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setPendingId(item.id);
                      dialogRef.current?.showModal();
                    }}
                  >
                    {t('admin.solutions.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.solutions.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.solutions.title')}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>
            {t('admin.solutions.previous')}
          </button>
          <p>
            {t('admin.solutions.page')} {data.page} / {totalPages}
          </p>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}>
            {t('admin.solutions.next')}
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
          <h3>{t('admin.solutions.delete.confirm')}</h3>
          <p>{t('admin.solutions.delete.confirm_body')}</p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setPendingId(null);
                dialogRef.current?.close();
              }}
            >
              {t('admin.solutions.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.solutions.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
      <BulkDeleteDialog bulk={bulk} />
    </section>
  );
}
