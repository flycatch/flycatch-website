import { useEffect, useRef, useState } from 'react';
import { apiErrorMessage, deleteCategory, listCategories, type Category } from '../lib/admin-api';
import { useBulkTable } from '../lib/use-bulk-table';
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

export default function CategoriesList({ onAdd, onEdit, notice }: Props) {
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  async function load() {
    setError(null);
    try {
      const result = await listCategories();
      setItems(result.items);
    } catch {
      setError(t('admin.workspace.request_failed'));
    }
  }

  const bulk = useBulkTable({
    ids: items?.map((item) => item.id) ?? [],
    resetKey: 'categories',
    path: '/admin/categories',
    onReload: () => load(),
    onError: setError,
  });

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
      await deleteCategory(pendingId);
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
        <h2>{t('admin.categories.title')}</h2>
        <button type="button" className="primary" onClick={onAdd}>
          {t('admin.categories.add')}
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
      <BulkActionsBar bulk={bulk} />
      <div className="roles-table-wrap" aria-busy={loading}>
        <table className="roles-table">
          <thead>
            <tr>
              <SelectAllHeader bulk={bulk} />
              <th scope="col">{t('admin.categories.name')}</th>
              <th scope="col">{t('admin.categories.state')}</th>
              <th scope="col">{t('admin.categories.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((category) => (
              <tr key={category.id}>
                <RowSelectCell bulk={bulk} id={category.id} />
                <td data-label={t('admin.categories.name')}>{category.name}</td>
                <td data-label={t('admin.categories.state')}>
                  {category.status === 'publish'
                    ? t('admin.categories.status.publish')
                    : t('admin.categories.status.draft')}
                </td>
                <td data-label={t('admin.categories.actions')} className="roles-row-actions">
                  <button type="button" onClick={() => onEdit(category.id)}>
                    {t('admin.categories.edit_action')}
                  </button>
                  <button type="button" className="danger" onClick={() => openDelete(category.id)}>
                    {t('admin.categories.delete_action')}
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
          <p className="roles-empty empty-state">{t('admin.categories.empty')}</p>
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
          <h3>{t('admin.categories.delete.confirm')}</h3>
          <p>{t('admin.categories.delete.confirm_body')}</p>
          <div className="actions">
            <button type="button" onClick={closeDelete}>
              {t('admin.categories.delete.cancel')}
            </button>
            <button type="submit" className="danger">
              {t('admin.categories.delete_action')}
            </button>
          </div>
        </form>
      </dialog>
      <BulkDeleteDialog bulk={bulk} />
    </section>
  );
}
