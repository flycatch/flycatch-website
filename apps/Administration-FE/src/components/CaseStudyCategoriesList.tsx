import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteCaseStudyCategory,
  listCaseStudyCategories,
  type CaseStudyCategoryList,
} from '../lib/admin-api';
import { formatDateTime } from '../lib/format-date';
import { t } from '../lib/i18n';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function CaseStudyCategoriesList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CaseStudyCategoryList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      const result = await listCaseStudyCategories(nextQuery, nextPage);
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
      await deleteCaseStudyCategory(pendingId);
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
        <h2>{t('admin.case_study_categories.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.case_study_categories.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t('admin.case_study_categories.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t('admin.case_study_categories.search.submit')}</button>
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
              <th scope="col">{t('admin.case_study_categories.id')}</th>
              <th scope="col">{t('admin.case_study_categories.name')}</th>
              <th scope="col">{t('admin.case_study_categories.case_studies')}</th>
              <th scope="col">{t('admin.case_study_categories.created_at')}</th>
              <th scope="col">{t('admin.case_study_categories.state')}</th>
              <th scope="col">{t('admin.case_study_categories.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id}>
                <td data-label={t('admin.case_study_categories.id')}>{item.id}</td>
                <td data-label={t('admin.case_study_categories.name')}>{item.name}</td>
                <td data-label={t('admin.case_study_categories.case_studies')}>
                  {item.case_studies}
                </td>
                <td data-label={t('admin.case_study_categories.created_at')}>
                  {formatDateTime(item.created_at)}
                </td>
                <td data-label={t('admin.case_study_categories.state')}>
                  {item.state === 'publish'
                    ? t('admin.case_studies.status.publish')
                    : t('admin.case_studies.status.draft')}
                </td>
                <td
                  data-label={t('admin.case_study_categories.actions')}
                  className="roles-row-actions"
                >
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t('admin.case_study_categories.edit_action')}
                  </button>
                  <button type="button" className="danger" onClick={() => openDelete(item.id)}>
                    {t('admin.case_study_categories.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.case_study_categories.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.case_study_categories.title')}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {t('admin.case_study_categories.previous')}
          </button>
          <p>
            {t('admin.case_study_categories.page')} {data.page} / {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('admin.case_study_categories.next')}
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
          <h3>{t('admin.case_study_categories.delete.confirm')}</h3>
          <p>{t('admin.case_study_categories.delete.confirm_body')}</p>
          <div className="actions">
            <button type="button" onClick={closeDelete}>
              {t('admin.case_study_categories.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.case_study_categories.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
