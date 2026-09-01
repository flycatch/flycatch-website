import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiErrorMessage } from '../lib/admin-api';
import { applyPagedResult, useBulkTable } from '../lib/use-bulk-table';
import { t } from '../lib/i18n';
import {
  BulkActionsBar,
  BulkDeleteDialog,
  RowSelectCell,
  SelectAllHeader,
} from './BulkTableControls';
import TableLogo from './TableLogo';

export type NamedPageSummary = {
  id: string;
  page_name: string;
  banner_title: string;
  banner_image_key: string | null;
  introduction_title: string;
  state: 'draft' | 'publish';
};

export type NamedPageListData = {
  items: NamedPageSummary[];
  page: number;
  per_page: number;
  total: number;
};

interface Props {
  ns: string;
  columnMode: 'cloud' | 'data';
  notice: string | null;
  onAdd: () => void;
  onEdit: (id: string) => void;
  list: (q: string, page: number) => Promise<NamedPageListData>;
  remove: (id: string) => Promise<void>;
  bulkPath: string;
}

export default function NamedPageList({
  ns,
  columnMode,
  notice,
  onAdd,
  onEdit,
  list,
  remove,
  bulkPath,
}: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NamedPageListData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      applyPagedResult(await list(nextQuery, nextPage), nextPage, setPage, setData);
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }

  const bulk = useBulkTable({
    ids: data?.items.map((item) => item.id) ?? [],
    resetKey: `${bulkPath}:${page}:${appliedQuery}`,
    path: bulkPath,
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
      await remove(pendingId);
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
        <h2>{t(`${ns}.title`)}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t(`${ns}.add`)}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t(`${ns}.search`)}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t(`${ns}.search.submit`)}</button>
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
              <th scope="col">{t(`${ns}.id`)}</th>
              {columnMode === 'cloud' ? (
                <>
                  <th scope="col">{t(`${ns}.page_name`)}</th>
                  <th scope="col">{t(`${ns}.banner_title`)}</th>
                  <th scope="col">{t(`${ns}.banner_image`)}</th>
                </>
              ) : (
                <>
                  <th scope="col">{t(`${ns}.page_name`)}</th>
                  <th scope="col">{t(`${ns}.banner_title`)}</th>
                  <th scope="col">{t(`${ns}.banner_image`)}</th>
                </>
              )}
              <th scope="col">{t(`${ns}.state`)}</th>
              <th scope="col">{t(`${ns}.actions`)}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <RowSelectCell bulk={bulk} id={item.id} />
                <td data-label={t(`${ns}.id`)}>
                  {(data.page - 1) * data.per_page + index + 1}
                </td>
                {columnMode === 'cloud' ? (
                  <>
                    <td data-label={t(`${ns}.page_name`)}>{item.page_name}</td>
                    <td data-label={t(`${ns}.banner_title`)}>{item.banner_title}</td>
                    <td data-label={t(`${ns}.banner_image`)}>
                      <TableLogo mediaKey={item.banner_image_key} alt={item.banner_title} />
                    </td>
                  </>
                ) : (
                  <>
                    <td data-label={t(`${ns}.page_name`)}>{item.page_name}</td>
                    <td data-label={t(`${ns}.banner_title`)}>{item.banner_title}</td>
                    <td data-label={t(`${ns}.banner_image`)}>
                      <TableLogo mediaKey={item.banner_image_key} alt={item.banner_title} />
                    </td>
                  </>
                )}
                <td data-label={t(`${ns}.state`)}>
                  {item.state === 'publish' ? t(`${ns}.status.publish`) : t(`${ns}.status.draft`)}
                </td>
                <td data-label={t(`${ns}.actions`)} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(item.id)}>
                    {t(`${ns}.edit_action`)}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setPendingId(item.id);
                      dialogRef.current?.showModal();
                    }}
                  >
                    {t(`${ns}.delete_action`)}
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
          <p className="roles-empty empty-state">{t(`${ns}.empty`)}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t(`${ns}.title`)}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>
            {t(`${ns}.previous`)}
          </button>
          <p>
            {t(`${ns}.page`)} {data.page} / {totalPages}
          </p>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}>
            {t(`${ns}.next`)}
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
          <h3>{t(`${ns}.delete.confirm`)}</h3>
          <p>{t(`${ns}.delete.confirm_body`)}</p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setPendingId(null);
                dialogRef.current?.close();
              }}
            >
              {t(`${ns}.delete.cancel`)}
            </button>
            <button type="submit" className="danger">
              {t(`${ns}.delete_action`)}
            </button>
          </div>
        </form>
      </dialog>
      <BulkDeleteDialog bulk={bulk} />
    </section>
  );
}
