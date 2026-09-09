import { t } from '../lib/i18n';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isDuplicate(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const record = body as Record<string, unknown>;
  const fields =
    (record.fields as Record<string, { message_key?: string }> | undefined) ||
    ((record.detail as Record<string, unknown> | undefined)?.fields as
      | Record<string, { message_key?: string }>
      | undefined);
  const key = fields?.email?.message_key ?? '';
  return key.includes('duplicate');
}

function initFooterSubscribe() {
  const form = document.querySelector('[data-footer-subscribe]');
  if (!(form instanceof HTMLFormElement)) return;

  const input = form.querySelector('#footer-subscribe-email');
  const button = form.querySelector('.footer-subscribe-btn');
  const label = form.querySelector('[data-footer-subscribe-label]');
  const status = form.querySelector('[data-footer-subscribe-status]');
  if (
    !(input instanceof HTMLInputElement) ||
    !(button instanceof HTMLButtonElement) ||
    !(label instanceof HTMLElement) ||
    !(status instanceof HTMLElement)
  ) {
    return;
  }

  const idleLabel = button.dataset.label || t('footer.subscribe');
  const loadingLabel = button.dataset.loadingLabel || t('footer.subscribe_loading');

  const setBusy = (busy: boolean) => {
    button.disabled = busy;
    button.setAttribute('aria-busy', busy ? 'true' : 'false');
    label.textContent = busy ? loadingLabel : idleLabel;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = input.value.trim();
    status.textContent = '';
    status.classList.remove('is-error', 'is-success');

    if (!EMAIL_PATTERN.test(email)) {
      status.textContent = t('footer.subscribe_invalid');
      status.classList.add('is-error');
      input.focus();
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/v1/public/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.status === 201) {
        status.textContent = t('footer.subscribe_success');
        status.classList.add('is-success');
        form.reset();
        return;
      }
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      status.textContent = isDuplicate(body)
        ? t('footer.subscribe_duplicate')
        : response.status === 422
          ? t('footer.subscribe_invalid')
          : t('footer.subscribe_error');
      status.classList.add('is-error');
    } catch {
      status.textContent = t('footer.subscribe_error');
      status.classList.add('is-error');
    } finally {
      setBusy(false);
    }
  });
}

initFooterSubscribe();
