import { t } from '../lib/i18n';

interface Option {
  id: string;
  name: string;
}

interface Props {
  id: string;
  label: string;
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function MultiSelect({ id, label, options, selectedIds, onChange }: Props) {
  const selected = options.filter((option) => selectedIds.includes(option.id));
  const available = options.filter((option) => !selectedIds.includes(option.id));

  function add(value: string) {
    if (!value || selectedIds.includes(value)) return;
    onChange([...selectedIds, value]);
  }

  function remove(value: string) {
    onChange(selectedIds.filter((idValue) => idValue !== value));
  }

  return (
    <div className="multi-select">
      <label htmlFor={id}>{label}</label>
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
