import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteCatalog,
  listCatalog,
  type CatalogListPayload,
} from '../lib/admin-api';
import { applyPagedResult, useBulkTable } from '../lib/use-bulk-table';
import { t } from '../lib/i18n';
import type { CatalogSection } from '../lib/catalog-sections';
import {
  BulkActionsBar,
  BulkDeleteDialog,
  RowSelectCell,
  SelectAllHeader,
} from './BulkTableControls';
import RelationCountCell from './RelationCountCell';
import TableLogo from './TableLogo';

interface Props {
  section: CatalogSection;
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function CatalogList({ section, onAdd, onEdit, notice }: Props) {
  const ns = section.ns;
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CatalogListPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      applyPagedResult(await listCatalog(section.path, nextQuery, nextPage), nextPage, setPage, setData);
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }

  const bulk = useBulkTable({
    ids: data?.items.map((item) => item.id) ?? [],
    resetKey: `${section.path}:${page}:${appliedQuery}`,
    path: section.path,
    onReload: () => load(appliedQuery, page),
    onError: setError,
  });

  useEffect(() => {
    load(appliedQuery, page).catch(() => undefined);
  }, [appliedQuery, page, section.path]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(query.trim());
  }

  async function confirmDelete() {
    if (!pendingId) return;
    try {
      await deleteCatalog(section.path, pendingId);
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
              {section.columns.map((column) => (
                <th key={column.key} scope="col">
                  {t(`${ns}.${column.labelKey}`)}
                </th>
              ))}
              <th scope="col">{t(`${ns}.actions`)}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.id}>
                <RowSelectCell bulk={bulk} id={item.id} />
                <td data-label={t(`${ns}.id`)}>{(data.page - 1) * data.per_page + index + 1}</td>
                {section.columns.map((column) => {
                  const label = t(`${ns}.${column.labelKey}`);
                  const value = item[column.key];
                  if (column.kind === 'state') {
                    return (
                      <td key={column.key} data-label={label}>
                        {value === 'publish' ? t(`${ns}.status.publish`) : t(`${ns}.status.draft`)}
                      </td>
                    );
                  }
                  if (column.kind === 'media') {
                    return (
                      <td key={column.key} data-label={label}>
                        {typeof value === 'string' && value ? <TableLogo mediaKey={value} alt={label} /> : '—'}
                      </td>
                    );
                  }
                  if (column.kind === 'count') {
                    const names = Array.isArray(item[column.namesKey])
                      ? (item[column.namesKey] as string[])
                      : [];
                    return (
                      <td key={column.key} data-label={label}>
                        <RelationCountCell count={Number(value) || 0} names={names} label={label} />
                      </td>
                    );
                  }
                  if (column.kind === 'bool') {
                    return (
                      <td key={column.key} data-label={label}>
                        {value ? t(`${ns}.active.true`) : t(`${ns}.active.false`)}
                      </td>
                    );
                  }
                  if (column.kind === 'date') {
                    const text = typeof value === 'string' && value ? value.slice(0, 10) : '—';
                    return (
                      <td key={column.key} data-label={label}>
                        {text}
                      </td>
                    );
                  }
                  if (column.kind === 'format') {
                    const text = typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : '';
                    return (
                      <td key={column.key} data-label={label}>
                        {text ? (
                          <span className="file-format-badge" title={text}>
                            {text}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    );
                  }
                  return (
                    <td key={column.key} data-label={label} className={column.kind === 'seo' ? 'table-review-cell' : undefined}>
                      {value === null || value === undefined || value === '' ? '—' : String(value)}
                    </td>
                  );
                })}
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
        {data && data.items.length === 0 && <p className="roles-empty empty-state">{t(`${ns}.empty`)}</p>}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t(`${ns}.title`)}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            {t(`${ns}.previous`)}
          </button>
          <p>
            {t(`${ns}.page`)} {data.page} / {totalPages}
          </p>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
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
            <button type="button" onClick={() => dialogRef.current?.close()}>
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
