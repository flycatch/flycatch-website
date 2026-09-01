import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiErrorMessage, bulkDeleteRecords, bulkUnpublishRecords } from '../lib/admin-api';

export function applyPagedResult<T extends { items: unknown[] }>(
  result: T,
  page: number,
  setPage: (updater: number | ((current: number) => number)) => void,
  setData: (data: T) => void,
): void {
  if (result.items.length === 0 && page > 1) {
    setPage((current) => Math.max(1, current - 1));
    return;
  }
  setData(result);
}

export function useBulkTable({
  ids,
  resetKey,
  path,
  supportsUnpublish = true,
  canSelect,
  onReload,
  onError,
}: {
  ids: string[];
  resetKey: string;
  path: string;
  supportsUnpublish?: boolean;
  canSelect?: (id: string) => boolean;
  onReload: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const headerRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const eligible = useMemo(
    () => ids.filter((id) => (canSelect ? canSelect(id) : true)),
    [ids, canSelect],
  );

  useEffect(() => {
    setSelected(new Set());
  }, [resetKey]);

  useEffect(() => {
    setSelected((current) => {
      const allowed = new Set(eligible);
      const next = new Set([...current].filter((id) => allowed.has(id)));
      if (next.size === current.size) return current;
      return next;
    });
  }, [eligible]);

  const selectedIds = useMemo(() => [...selected], [selected]);
  const allSelected = eligible.length > 0 && eligible.every((id) => selected.has(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  useEffect(() => {
    if (headerRef.current) headerRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggleAll = useCallback(() => {
    setSelected((current) => {
      if (eligible.length > 0 && eligible.every((id) => current.has(id))) {
        return new Set();
      }
      return new Set(eligible);
    });
  }, [eligible]);

  const toggleRow = useCallback((id: string, enabled = true) => {
    if (!enabled) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const run = useCallback(
    async (action: 'unpublish' | 'delete') => {
      if (!selectedIds.length) return;
      setBusy(true);
      try {
        if (action === 'unpublish') {
          await bulkUnpublishRecords(path, selectedIds);
        } else {
          await bulkDeleteRecords(path, selectedIds);
        }
        setSelected(new Set());
        dialogRef.current?.close();
        await onReload();
      } catch (caught) {
        dialogRef.current?.close();
        onError(apiErrorMessage(caught));
      } finally {
        setBusy(false);
      }
    },
    [onError, onReload, path, selectedIds],
  );

  return {
    selectedCount: selectedIds.length,
    busy,
    supportsUnpublish,
    headerRef,
    dialogRef,
    allSelected,
    isSelected: (id: string) => selected.has(id),
    isSelectable: (id: string) => (canSelect ? canSelect(id) : true),
    toggleAll,
    toggleRow,
    unpublish: () => run('unpublish'),
    openDelete: () => dialogRef.current?.showModal(),
    closeDelete: () => dialogRef.current?.close(),
    confirmDelete: () => run('delete'),
  };
}
