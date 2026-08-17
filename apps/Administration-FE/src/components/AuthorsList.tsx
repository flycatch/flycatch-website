import { useEffect, useRef, useState } from 'react';
import { apiErrorMessage, deleteAuthor, listAuthors, type Author } from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  onAdd: () => void;
  onEdit: (id: string) => void;
  notice: string | null;
}

export default function AuthorsList({ onAdd, onEdit, notice }: Props) {
  const [items, setItems] = useState<Author[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load() {
    setError(null);
    try {
      const result = await listAuthors();
      setItems(result.items);
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

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
      await deleteAuthor(pendingId);
      closeDelete();
      await load();
    } catch (caught) {
      closeDelete();
      setError(apiErrorMessage(caught));
    }
  }

  const loading = items === null && !error;

  return (
    <section className="roles-page">
      <div className="roles-toolbar">
        <h2>{t('admin.authors.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.authors.add')}
        </button>
      </div>
      {notice && (
        <p role="status" className="roles-notice">
          {notice}
        </p>
      )}
      {error && (
        <p className="alert alert-error error" role="alert">
          {error}
        </p>
      )}
      <div className="roles-table-wrap" aria-busy={loading}>
        <table className="roles-table">
          <thead>
            <tr>
              <th scope="col">{t('admin.authors.name')}</th>
              <th scope="col">{t('admin.authors.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((author) => (
              <tr key={author.id}>
                <td data-label={t('admin.authors.name')}>{author.name}</td>
                <td data-label={t('admin.authors.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(author.id)}>
                    {t('admin.authors.edit_action')}
                  </button>
                  <button type="button" className="danger" onClick={() => openDelete(author.id)}>
                    {t('admin.authors.delete_action')}
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
        {items && items.length === 0 && (
          <p className="roles-empty empty-state">{t('admin.authors.empty')}</p>
        )}
      </div>
      <dialog ref={dialogRef} className="roles-dialog" onClose={() => setPendingId(null)}>
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            confirmDelete().catch(() => undefined);
          }}
        >
          <h3>{t('admin.authors.delete.confirm')}</h3>
          <p>{t('admin.authors.delete.confirm_body')}</p>
          <div className="actions">
            <button type="button" onClick={closeDelete}>
              {t('admin.authors.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.authors.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
