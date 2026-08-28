import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteDigitalTransformation,
  listDigitalTransformations,
  type DigitalTransformationList,
} from '../lib/admin-api';
import { t } from '../lib/i18n';
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
  const [data, setData] = useState<DigitalTransformationList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      setData(await listDigitalTransformations(nextQuery, nextPage));
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

  async function confirmDelete() {
    if (!pendingId) return;
    try {
      await deleteDigitalTransformation(pendingId);
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
        <h2>{t('admin.digital_transformation.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.digital_transformation.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t('admin.digital_transformation.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t('admin.digital_transformation.search.submit')}</button>
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
              <th scope="col">{t('admin.digital_transformation.id')}</th>
              <th scope="col">{t('admin.digital_transformation.banner_title')}</th>
              <th scope="col">{t('admin.digital_transformation.banner_image')}</th>
              <th scope="col">{t('admin.digital_transformation.banner_tag_line')}</th>
              <th scope="col">{t('admin.digital_transformation.state')}</th>
              <th scope="col">{t('admin.digital_transformation.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <td data-label={t('admin.digital_transformation.id')}>
                  {(data.page - 1) * data.per_page + index + 1}
                </td>
                <td data-label={t('admin.digital_transformation.banner_title')}>{item.banner_title}</td>
                <td data-label={t('admin.digital_transformation.banner_image')}>
                  <TableLogo mediaKey={item.banner_image_key} alt={item.banner_title} />
                </td>
                <td data-label={t('admin.digital_transformation.banner_tag_line')}>{item.banner_tag_line}</td>
                <td data-label={t('admin.digital_transformation.state')}>
                  {item.state === 'publish'
                    ? t('admin.digital_transformation.status.publish')
                    : t('admin.digital_transformation.status.draft')}
                </td>
                <td data-label={t('admin.digital_transformation.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t('admin.digital_transformation.edit_action')}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setPendingId(item.id);
                      dialogRef.current?.showModal();
                    }}
                  >
                    {t('admin.digital_transformation.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.digital_transformation.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.digital_transformation.title')}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>
            {t('admin.digital_transformation.previous')}
          </button>
          <p>
            {t('admin.digital_transformation.page')} {data.page} / {totalPages}
          </p>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}>
            {t('admin.digital_transformation.next')}
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
          <h3>{t('admin.digital_transformation.delete.confirm')}</h3>
          <p>{t('admin.digital_transformation.delete.confirm_body')}</p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setPendingId(null);
                dialogRef.current?.close();
              }}
            >
              {t('admin.digital_transformation.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.digital_transformation.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
