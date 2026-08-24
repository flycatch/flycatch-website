import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteSolutionProduct,
  listSolutionProducts,
  type SolutionProductList,
} from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

function snippet(value: string): string {
  const text = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

export default function SolutionProductsList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SolutionProductList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      setData(await listSolutionProducts(nextQuery, nextPage));
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
        <h2>{t('admin.solution_products.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.solution_products.add')}
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
          {t('admin.solution_products.search')}
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
        </label>
        <button type="submit">{t('admin.solution_products.search.submit')}</button>
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
              <th scope="col">{t('admin.solution_products.id')}</th>
              <th scope="col">{t('admin.solution_products.product_title')}</th>
              <th scope="col">{t('admin.solution_products.product_description')}</th>
              <th scope="col">{t('admin.solution_products.product_tag')}</th>
              <th scope="col">{t('admin.solution_products.state')}</th>
              <th scope="col">{t('admin.solution_products.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <td data-label={t('admin.solution_products.id')}>
                  {(data.page - 1) * data.per_page + index + 1}
                </td>
                <td data-label={t('admin.solution_products.product_title')}>{item.product_title}</td>
                <td data-label={t('admin.solution_products.product_description')}>
                  {snippet(item.product_description)}
                </td>
                <td data-label={t('admin.solution_products.product_tag')}>{item.product_tag}</td>
                <td data-label={t('admin.solution_products.state')}>
                  {item.state === 'publish'
                    ? t('admin.solution_products.status.publish')
                    : t('admin.solution_products.status.draft')}
                </td>
                <td data-label={t('admin.solution_products.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t('admin.solution_products.edit_action')}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setPendingId(item.id);
                      dialogRef.current?.showModal();
                    }}
                  >
                    {t('admin.solution_products.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.solution_products.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.solution_products.title')}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>
            {t('admin.solution_products.previous')}
          </button>
          <p>
            {t('admin.solution_products.page')} {data.page} / {totalPages}
          </p>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}>
            {t('admin.solution_products.next')}
          </button>
        </nav>
      )}
      <dialog ref={dialogRef} className="roles-dialog" onClose={() => setPendingId(null)}>
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pendingId) return;
            deleteSolutionProduct(pendingId)
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
          <h3>{t('admin.solution_products.delete.confirm')}</h3>
          <p>{t('admin.solution_products.delete.confirm_body')}</p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setPendingId(null);
                dialogRef.current?.close();
              }}
            >
              {t('admin.solution_products.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.solution_products.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
