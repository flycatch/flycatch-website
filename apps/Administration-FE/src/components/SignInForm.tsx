import { useState } from 'react';
import { AdminApiError, signIn } from '../lib/admin-api';
import { t } from '../lib/i18n';

interface Props {
  onSignedIn: () => void;
}

export default function SignInForm({ onSignedIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await signIn(email, password);
      onSignedIn();
    } catch (err: unknown) {
      if (!(err instanceof AdminApiError)) {
        setError(t('admin.workspace.request_failed'));
        return;
      }
      if (err.detail && 'fields' in err.detail && err.detail.fields) {
        const mapped: Record<string, string> = {};
        for (const [field, value] of Object.entries(err.detail.fields)) {
          mapped[field] = t(value.message_key);
        }
        setFieldErrors(mapped);
      } else if (err.status === 401) {
        const messageKey =
          ('message_key' in err.detail && err.detail.message_key) || 'admin.sign_in.error';
        setError(t(messageKey));
      } else {
        const messageKey =
          ('message_key' in err.detail && err.detail.message_key) ||
          'admin.workspace.request_failed';
        setError(t(messageKey));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} method="post" action="/admin/" noValidate>
      <div className="auth-brand">
        <span className="brand-mark" aria-hidden="true" />
        <span>{t('admin.workspace.title')}</span>
      </div>
      <h1>{t('admin.sign_in.title')}</h1>
      <label>
        {t('admin.sign_in.email')}
        <input
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          required
        />
        {fieldErrors.email && (
          <span id="email-error" className="error" role="alert">
            {fieldErrors.email}
          </span>
        )}
      </label>
      <label>
        {t('admin.sign_in.password')}
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          required
        />
        {fieldErrors.password && (
          <span id="password-error" className="error" role="alert">
            {fieldErrors.password}
          </span>
        )}
      </label>
      {error && (
        <p className="alert alert-error error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary" disabled={loading} aria-busy={loading}>
        {t('admin.sign_in.submit')}
      </button>
    </form>
  );
}
