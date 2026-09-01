import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteCaseStudy,
  listCaseStudies,
  type CaseStudyList,
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

export default function CaseStudiesList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CaseStudyList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      applyPagedResult(await listCaseStudies(nextQuery, nextPage), nextPage, setPage, setData);
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }


  const bulk = useBulkTable({
    ids: data?.items.map((item) => item.id) ?? [],
    resetKey: `/admin/case-studies:${page}:${appliedQuery}`,
    path: '/admin/case-studies',
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
      await deleteCaseStudy(pendingId);
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
        <h2>{t('admin.case_studies.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.case_studies.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t('admin.case_studies.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t('admin.case_studies.search.submit')}</button>
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
              <th scope="col">{t('admin.case_studies.id')}</th>
              <th scope="col">{t('admin.case_studies.heading')}</th>
              <th scope="col">{t('admin.case_studies.industry')}</th>
              <th scope="col">{t('admin.case_studies.order')}</th>
              <th scope="col">{t('admin.case_studies.short_heading')}</th>
              <th scope="col">{t('admin.case_studies.content_available_in')}</th>
              <th scope="col">{t('admin.case_studies.state')}</th>
              <th scope="col">{t('admin.case_studies.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <RowSelectCell bulk={bulk} id={item.id} />
                <td data-label={t('admin.case_studies.id')}>
                  {(data.page - 1) * data.per_page + index + 1}
                </td>
                <td data-label={t('admin.case_studies.heading')}>{item.heading}</td>
                <td data-label={t('admin.case_studies.industry')}>{item.industry || '—'}</td>
                <td data-label={t('admin.case_studies.order')}>{item.order}</td>
                <td data-label={t('admin.case_studies.short_heading')}>
                  {item.short_heading || '—'}
                </td>
                <td data-label={t('admin.case_studies.content_available_in')}>
                  {item.content_available_in}
                </td>
                <td data-label={t('admin.case_studies.state')}>
                  {item.state === 'publish'
                    ? t('admin.case_studies.status.publish')
                    : t('admin.case_studies.status.draft')}
                </td>
                <td data-label={t('admin.case_studies.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t('admin.case_studies.edit_action')}
                  </button>
                  <button type="button" className="danger" onClick={() => openDelete(item.id)}>
                    {t('admin.case_studies.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.case_studies.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.case_studies.title')}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {t('admin.case_studies.previous')}
          </button>
          <p>
            {t('admin.case_studies.page')} {data.page} / {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('admin.case_studies.next')}
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
          <h3>{t('admin.case_studies.delete.confirm')}</h3>
          <p>{t('admin.case_studies.delete.confirm_body')}</p>
          <div className="actions">
            <button type="button" onClick={closeDelete}>
              {t('admin.case_studies.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.case_studies.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
      <BulkDeleteDialog bulk={bulk} />
    </section>
  );
}
