import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../lib/i18n';

interface Props {
  count: number;
  names: string[];
  label: string;
}

type Coords = { top: number; left: number; maxHeight: number; placement: 'below' | 'above' };

export default function RelationCountCell({ count, names, label }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0, maxHeight: 240, placement: 'below' });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const itemLabel =
    count === 1 ? t('admin.catalog.items.one') : t('admin.catalog.items.many').replace('{count}', String(count));

  function placePopover() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 280;
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const placement: 'below' | 'above' = spaceBelow < 160 && spaceAbove > spaceBelow ? 'above' : 'below';
    const maxHeight = Math.max(120, Math.min(280, placement === 'above' ? spaceAbove : spaceBelow));
    const left = Math.min(Math.max(margin, rect.left), Math.max(margin, window.innerWidth - width - margin));
    setCoords({
      top: placement === 'above' ? rect.top - margin : rect.bottom + margin,
      left,
      maxHeight,
      placement,
    });
  }

  useEffect(() => {
    if (!open) return;
    placePopover();

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    function onReposition() {
      setOpen(false);
    }

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  return (
    <div className="relation-count">
      <button
        ref={triggerRef}
        type="button"
        className="relation-count-trigger"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="relation-count-label">{itemLabel}</span>
        <span className={`relation-count-icon${open ? ' is-open' : ''}`} aria-hidden="true" />
      </button>
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              id={listId}
              className={`relation-count-popover relation-count-popover-${coords.placement}`}
              role="dialog"
              aria-label={label}
              style={{
                top: coords.placement === 'below' ? coords.top : undefined,
                bottom: coords.placement === 'above' ? window.innerHeight - coords.top : undefined,
                left: coords.left,
                maxHeight: coords.maxHeight,
              }}
            >
              {names.length ? (
                <ul>
                  {names.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <p>{t('admin.catalog.items.empty')}</p>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
