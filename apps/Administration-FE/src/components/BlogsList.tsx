import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  apiErrorMessage,
  deleteBlog,
  listBlogs,
  type BlogList,
} from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function BlogsList({ onAdd, onEdit, notice }: Props) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BlogList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load(nextQuery: string, nextPage: number) {
    setError(null);
    try {
      const result = await listBlogs(nextQuery, nextPage);
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
      await deleteBlog(pendingId);
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
        <h2>{t('admin.blogs.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.blogs.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      <form className="roles-search" onSubmit={search} role="search">
        <label>
          {t('admin.blogs.search')}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit">{t('admin.blogs.search.submit')}</button>
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
              <th scope="col">{t('admin.blogs.id')}</th>
              <th scope="col">{t('admin.blogs.title.column')}</th>
              <th scope="col">{t('admin.blogs.slug')}</th>
              <th scope="col">{t('admin.blogs.author')}</th>
              <th scope="col">{t('admin.blogs.content_available_in')}</th>
              <th scope="col">{t('admin.blogs.state')}</th>
              <th scope="col">{t('admin.blogs.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((blog) => (
              <tr key={blog.id}>
                <td data-label={t('admin.blogs.id')}>{blog.id}</td>
                <td data-label={t('admin.blogs.title.column')}>{blog.title}</td>
                <td data-label={t('admin.blogs.slug')}>{blog.slug}</td>
                <td data-label={t('admin.blogs.author')}>{blog.author || '—'}</td>
                <td data-label={t('admin.blogs.content_available_in')}>
                  {blog.content_available_in}
                </td>
                <td data-label={t('admin.blogs.state')}>
                  {blog.state === 'publish' ? t('admin.blogs.status.publish') : t('admin.blogs.status.draft')}
                </td>
                <td data-label={t('admin.blogs.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(blog.id)}>
                    {t('admin.blogs.edit_action')}
                  </button>
                  <button type="button" className="danger" onClick={() => openDelete(blog.id)}>
                    {t('admin.blogs.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.blogs.empty')}</p>
        )}
      </div>
      {data && data.total > data.per_page && (
        <nav className="roles-pagination" aria-label={t('admin.blogs.title')}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {t('admin.blogs.previous')}
          </button>
          <p>
            {t('admin.blogs.page')} {data.page} / {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('admin.blogs.next')}
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
          <h3>{t('admin.blogs.delete.confirm')}</h3>
          <p>{t('admin.blogs.delete.confirm_body')}</p>
          <div className="actions">
            <button type="button" onClick={closeDelete}>
              {t('admin.blogs.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.blogs.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
