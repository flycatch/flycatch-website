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
          {t('admin.form.back')}
        </button>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
