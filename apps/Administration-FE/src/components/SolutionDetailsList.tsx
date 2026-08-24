import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteSolutionDetail,
  listSolutionDetails,
  type SolutionDetailList,
} from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function SolutionDetailsList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SolutionDetailList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      setData(await listSolutionDetails(nextQuery, nextPage));
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }

  useEffect(() => {
    load(appliedQuery, page).catch(() => undefined);
  }, [appliedQuery, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1;
  const loading = data === null && !error;

  return (
    <section className="roles-page">
      <div className="roles-toolbar">
        <h2>{t('admin.solution_details.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.solution_details.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form
        className="roles-search"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          setPage(1);
          setAppliedQuery(query.trim());
        }}
        role="search"
      >
        <label>
          {t('admin.solution_details.search')}
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
        </label>
        <button type="submit">{t('admin.solution_details.search.submit')}</button>
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
              <th scope="col">{t('admin.solution_details.id')}</th>
              <th scope="col">{t('admin.solution_details.banner')}</th>
              <th scope="col">{t('admin.solution_details.introduction')}</th>
              <th scope="col">{t('admin.solution_details.challenges')}</th>
              <th scope="col">{t('admin.solution_details.state')}</th>
              <th scope="col">{t('admin.solution_details.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <td data-label={t('admin.solution_details.id')}>
                  {(data.page - 1) * data.per_page + index + 1}
                </td>
                <td data-label={t('admin.solution_details.banner')}>{item.banner_title}</td>
                <td data-label={t('admin.solution_details.introduction')}>{item.introduction_title}</td>
                <td data-label={t('admin.solution_details.challenges')}>{item.challenges_title}</td>
                <td data-label={t('admin.solution_details.state')}>
                  {item.state === 'publish'
                    ? t('admin.solution_details.status.publish')
                    : t('admin.solution_details.status.draft')}
                </td>
                <td data-label={t('admin.solution_details.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t('admin.solution_details.edit_action')}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setPendingId(item.id);
                      dialogRef.current?.showModal();
                    }}
                  >
                    {t('admin.solution_details.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.solution_details.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.solution_details.title')}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>
            {t('admin.solution_details.previous')}
          </button>
          <p>
            {t('admin.solution_details.page')} {data.page} / {totalPages}
          </p>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}>
            {t('admin.solution_details.next')}
          </button>
        </nav>
      )}
      <dialog ref={dialogRef} className="roles-dialog" onClose={() => setPendingId(null)}>
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pendingId) return;
            deleteSolutionDetail(pendingId)
              .then(() => {
                setPendingId(null);
                dialogRef.current?.close();
                return load(appliedQuery, page);
              })
              .catch((caught) => {
                dialogRef.current?.close();
                setPendingId(null);
                setError(apiErrorMessage(caught));
              });
          }}
        >
          <h3>{t('admin.solution_details.delete.confirm')}</h3>
          <p>{t('admin.solution_details.delete.confirm_body')}</p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setPendingId(null);
                dialogRef.current?.close();
              }}
            >
              {t('admin.solution_details.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.solution_details.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
