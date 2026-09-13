import { conversionEvent } from '../lib/form-proxy';
import { t } from '../lib/i18n';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, string>>;
    grecaptcha?: { getResponse: () => string };
  }
}

function pushConversion(formId: string, extra: Record<string, string> = {}) {
  const payload = conversionEvent(formId, extra);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

function applyContactVisibility(form: HTMLFormElement) {
  const selected = form.querySelector<HTMLInputElement>('input[name="contact_type"]:checked');
  const type = selected?.value || 'GENERAL_ENQUIRY';
  form.querySelectorAll<HTMLElement>('[data-for-types]').forEach((row) => {
    const allowed = (row.dataset.forTypes || '').split(/\s+/);
    const on = allowed.includes(type);
    row.hidden = !on;
    row.querySelectorAll('input, textarea').forEach((field) => {
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.required = on && ['company_name', 'subject', 'details'].includes(field.name);
      }
    });
  });
}

function setFieldError(field: Element | null, message: string) {
  if (!(field instanceof HTMLElement)) return;
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
  const label = field.closest('label');
  let hint = label?.querySelector<HTMLElement>('[data-field-error]');
  if (!hint && label) {
    hint = document.createElement('span');
    hint.dataset.fieldError = 'true';
    hint.className = 'field-error';
    label.append(hint);
  }
  if (hint) hint.textContent = message;
}

async function submitForm(form: HTMLFormElement, event: SubmitEvent) {
  event.preventDefault();
  const formId = form.dataset.publicForm || 'form';
  const status = form.querySelector<HTMLElement>('[data-form-status], [data-footer-subscribe-status]');
  const tokenInput = form.querySelector<HTMLInputElement>('input[name="recaptcha_token"]');
  if (tokenInput && window.grecaptcha) {
    tokenInput.value = window.grecaptcha.getResponse() || '';
  }
  form.querySelectorAll('[aria-invalid]').forEach((field) => setFieldError(field, ''));
  if (status) {
    status.textContent = '';
    status.classList.remove('is-error', 'is-success');
  }
  const body = new FormData(form);
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Requested-With': 'fetch' },
      body,
    });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      fields?: Record<string, string>;
      body?: { file_key?: string };
    };
    if (response.ok && payload.ok !== false) {
      if (status) {
        status.textContent = t(`form.success.${formId}` as 'form.success.contact');
        status.classList.add('is-success');
      }
      const extra: Record<string, string> = {};
      if (formId === 'contact') {
        extra.contact_type = String(body.get('contact_type') || '');
      }
      pushConversion(formId, extra);
      if (formId === 'download' && payload.body?.file_key) {
        window.location.assign(`/api/v1/public/media/${encodeURIComponent(payload.body.file_key)}`);
      }
      form.reset();
      return;
    }
    const fields = payload.fields || {};
    Object.entries(fields).forEach(([name, key]) => {
      setFieldError(form.querySelector(`[name="${name}"]`), t(key as 'form.error.invalid'));
    });
    const first = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    first?.focus();
    if (status) {
      status.textContent = t('form.error.generic');
      status.classList.add('is-error');
    }
  } catch {
    if (status) {
      status.textContent = t('form.error.unavailable');
      status.classList.add('is-error');
    }
  }
}

function init() {
  document.querySelectorAll<HTMLFormElement>('[data-public-form]').forEach((form) => {
    if (form.dataset.publicForm === 'contact') {
      applyContactVisibility(form);
      form.querySelectorAll('[data-contact-type]').forEach((input) => {
        input.addEventListener('change', () => applyContactVisibility(form));
      });
    }
    form.addEventListener('submit', (event) => {
      void submitForm(form, event);
    });
  });
}

init();
