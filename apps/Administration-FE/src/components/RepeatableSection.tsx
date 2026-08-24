import type { ReactNode } from 'react';

interface Props<T extends { key: string }> {
  title?: string;
  addLabel: string;
  removeLabel: string;
  items: T[];
  itemTitle: (item: T, index: number) => string;
  onAdd: () => void;
  onRemove: (key: string) => void;
  children: (item: T, index: number) => ReactNode;
}

export default function RepeatableSection<T extends { key: string }>({
  title,
  addLabel,
  removeLabel,
  items,
  itemTitle,
  onAdd,
  onRemove,
  children,
}: Props<T>) {
  return (
    <div className="repeatable-section">
      <div className="repeatable-section-header">
        {title ? <h3>{title}</h3> : null}
        <button type="button" onClick={onAdd}>
          {addLabel}
        </button>
      </div>
      {items.map((item, index) => (
        <details key={item.key} className="admin-accordion" open>
          <summary>{itemTitle(item, index)}</summary>
          {children(item, index)}
          <button type="button" className="danger" onClick={() => onRemove(item.key)}>
            {removeLabel}
          </button>
        </details>
      ))}
    </div>
  );
}
