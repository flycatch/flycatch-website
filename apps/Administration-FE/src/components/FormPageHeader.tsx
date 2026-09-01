import { t } from '../lib/i18n';

interface Props {
  title: string;
  onBack: () => void;
  disabled?: boolean;
}

export default function FormPageHeader({ title, onBack, disabled }: Props) {
  return (
    <div className="panel-header form-page-header">
      <div className="form-page-heading">
        <button type="button" className="form-back" onClick={onBack} disabled={disabled}>
          <svg className="form-back-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M9.78 3.22a.75.75 0 0 1 0 1.06L6.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
            />
          </svg>
          {t('admin.form.back')}
        </button>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
