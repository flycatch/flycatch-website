import { useState } from 'react';
import { signIn } from '../lib/admin-api';
import { t } from '../lib/i18n';

export default function SignInForm() {
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
      window.location.href = '/admin/';
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: { message_key?: string; fields?: Record<string, { message_key: string }> } };
      if (apiErr.detail?.fields) {
        const mapped: Record<string, string> = {};
        for (const [field, value] of Object.entries(apiErr.detail.fields)) {
          mapped[field] = t(value.message_key);
        }
        setFieldErrors(mapped);
      } else {
        setError(t(apiErr.detail?.message_key || 'admin.sign_in.error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
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
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary" disabled={loading}>
        {t('admin.sign_in.submit')}
      </button>
    </form>
  );
}
