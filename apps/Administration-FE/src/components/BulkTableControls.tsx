import type { RefObject } from 'react';
import { t } from '../lib/i18n';

interface BulkState {
  selectedCount: number;
  busy: boolean;
  supportsUnpublish: boolean;
  headerRef: RefObject<HTMLInputElement | null>;
  dialogRef: RefObject<HTMLDialogElement | null>;
  allSelected: boolean;
  isSelected: (id: string) => boolean;
  isSelectable: (id: string) => boolean;
  toggleAll: () => void;
  toggleRow: (id: string, enabled?: boolean) => void;
  unpublish: () => void;
  openDelete: () => void;
  closeDelete: () => void;
  confirmDelete: () => void;
}

export function BulkActionsBar({ bulk }: { bulk: BulkState }) {
  if (bulk.selectedCount === 0) return null;
  return (
    <div className="bulk-actions" role="region" aria-label={t('admin.bulk.actions')}>
      <p className="bulk-actions-count">
        {bulk.selectedCount} {t('admin.bulk.selected')}
      </p>
      <div className="bulk-actions-buttons">
        {bulk.supportsUnpublish && (
          <button type="button" disabled={bulk.busy} onClick={() => bulk.unpublish()}>
            {t('admin.bulk.unpublish')}
          </button>
        )}
        <button type="button" className="danger" disabled={bulk.busy} onClick={() => bulk.openDelete()}>
          {t('admin.bulk.delete')}
        </button>
      </div>
    </div>
  );
}

export function SelectAllHeader({ bulk }: { bulk: BulkState }) {
  return (
    <th scope="col" className="table-select">
      <input
        ref={bulk.headerRef}
        type="checkbox"
        checked={bulk.allSelected}
        disabled={bulk.busy}
        onChange={() => bulk.toggleAll()}
        aria-label={t('admin.bulk.select_all')}
      />
    </th>
  );
}

export function RowSelectCell({ bulk, id }: { bulk: BulkState; id: string }) {
  const enabled = bulk.isSelectable(id);
  return (
    <td data-label={t('admin.bulk.select')} className="table-select">
      <input
        type="checkbox"
        checked={bulk.isSelected(id)}
        disabled={!enabled || bulk.busy}
        onChange={() => bulk.toggleRow(id, enabled)}
        aria-label={t('admin.bulk.select')}
      />
    </td>
  );
}

export function BulkDeleteDialog({ bulk }: { bulk: BulkState }) {
  return (
    <dialog ref={bulk.dialogRef} className="roles-dialog">
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          bulk.confirmDelete();
        }}
      >
        <h3>{t('admin.bulk.delete.confirm')}</h3>
        <p>{t('admin.bulk.delete.confirm_body')}</p>
        <div className="actions">
          <button type="button" onClick={() => bulk.closeDelete()}>
            {t('admin.bulk.delete.cancel')}
          </button>
          <button type="submit" className="danger" disabled={bulk.busy}>
            {t('admin.bulk.delete')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
