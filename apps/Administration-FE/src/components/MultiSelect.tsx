import type { MouseEvent } from 'react';
import { t } from '../lib/i18n';

interface Option {
  id: string;
  name: string;
}

interface Props {
  id: string;
  label: string;
  manageHref: string;
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function onManageClick(event: MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return;
  }
  event.preventDefault();
  const url = new URL(event.currentTarget.href);
  const current = `${window.location.pathname}${window.location.search}`;
  const target = `${url.pathname}${url.search}`;
  if (current !== target) {
    window.history.pushState(null, '', target);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function MultiSelect({
  id,
  label,
  manageHref,
  options,
  selectedIds,
  onChange,
}: Props) {
  const selected = options.filter((option) => selectedIds.includes(option.id));
  const available = options.filter((option) => !selectedIds.includes(option.id));
  const labelId = `${id}-label`;

  function add(value: string) {
    if (!value || selectedIds.includes(value)) return;
    onChange([...selectedIds, value]);
  }

  function remove(value: string) {
    onChange(selectedIds.filter((idValue) => idValue !== value));
  }

  return (
    <div className="multi-select">
      <a
        id={labelId}
        className="multi-select-label"
        href={manageHref}
        onClick={onManageClick}
      >
        {label}
      </a>
      {selected.length > 0 ? (
        <ul className="multi-select-chips">
          {selected.map((option) => (
            <li key={option.id}>
              <span>{option.name}</span>
              <button
                type="button"
                className="multi-select-remove"
                onClick={() => remove(option.id)}
                aria-label={`${t('admin.blogs.multiselect.remove')} ${option.name}`}
              >
                {t('admin.blogs.multiselect.remove')}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">{t('admin.blogs.multiselect.empty')}</p>
      )}
      <select
        id={id}
        aria-labelledby={labelId}
        value=""
        disabled={available.length === 0}
        onChange={(event) => {
          add(event.target.value);
          event.target.value = '';
        }}
      >
        <option value="">
          {available.length === 0
            ? t('admin.blogs.multiselect.none_left')
            : t('admin.blogs.multiselect.add')}
        </option>
        {available.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
