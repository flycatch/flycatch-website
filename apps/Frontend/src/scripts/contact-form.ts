import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/styles';

import { t } from '../lib/i18n';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EnquiryType = 'GET_A_QUOTE' | 'PARTNERSHIP' | 'GENERAL_ENQUIRY';

interface Grecaptcha {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

function fieldError(form: HTMLFormElement, name: string): HTMLElement | null {
  return form.querySelector(`[data-error-for="${name}"]`);
}

function setFieldError(form: HTMLFormElement, name: string, message: string) {
  const input = form.querySelector(`[name="${name}"]`);
  const error = fieldError(form, name);
  if (input instanceof HTMLElement) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) input.setAttribute('aria-describedby', error.id);
  }
  if (error) error.textContent = message;
}

function visible(element: HTMLElement | null): element is HTMLElement {
  return element instanceof HTMLElement && !element.hidden;
}

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!(form instanceof HTMLFormElement)) return;

  const tabs = [...form.closest('.contact-form-column')?.querySelectorAll('[data-contact-type]') ?? []].filter(
    (tab): tab is HTMLButtonElement => tab instanceof HTMLButtonElement,
  );
  const details = form.querySelector('#contact-details');
  const company = form.querySelector('[data-company]');
  const subject = form.querySelector('[data-subject]');
  const privacy = form.querySelector('[data-privacy]');
  const privacyInput = form.querySelector('#contact-privacy');
  const phoneInput = form.querySelector('#contact-phone');
  const button = form.querySelector('[data-contact-submit]');
  const label = form.querySelector('[data-contact-submit-label]');
  const status = form.querySelector('[data-contact-status]');
  const captcha = form.querySelector('[data-contact-captcha]');
  if (
    !(details instanceof HTMLTextAreaElement) ||
    !(company instanceof HTMLElement) ||
    !(subject instanceof HTMLElement) ||
    !(privacy instanceof HTMLElement) ||
    !(privacyInput instanceof HTMLInputElement) ||
    !(phoneInput instanceof HTMLInputElement) ||
    !(button instanceof HTMLButtonElement) ||
    !(label instanceof HTMLElement) ||
    !(status instanceof HTMLElement) ||
    !(captcha instanceof HTMLElement)
  ) {
    return;
  }

  const iti = intlTelInput(phoneInput, {
    initialCountry: 'us',
    separateDialCode: true,
    countrySearch: true,
    countrySelectorMode: 'AUTO',
    dropdownParent: document.body,
    uiTranslations: { selectedCountryAriaLabel: t('page.contact.phone_country') },
    loadUtils: () => import('intl-tel-input/utils'),
  });

  let enquiry: EnquiryType = 'GET_A_QUOTE';
  let captchaToken = '';
  let widgetId: number | null = null;
  const siteKey = captcha.dataset.sitekey || '';

  const updateSubmit = () => {
    button.disabled = !captchaToken || button.getAttribute('aria-busy') === 'true';
  };

  const renderCaptcha = () => {
    if (!siteKey) {
      if (captcha.dataset.captchaDev === 'true') {
        setFieldError(form, 'captcha', t('page.contact.error.captcha_unavailable'));
      }
      return;
    }
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha?.render) {
      window.setTimeout(renderCaptcha, 100);
      return;
    }
    widgetId = grecaptcha.render(captcha, {
      sitekey: siteKey,
      callback: (token) => {
        captchaToken = token;
        setFieldError(form, 'captcha', '');
        updateSubmit();
      },
      'expired-callback': () => {
        captchaToken = '';
        updateSubmit();
      },
      'error-callback': () => {
        captchaToken = '';
        updateSubmit();
      },
    });
  };
  renderCaptcha();

  const showEnquiry = (next: EnquiryType) => {
    enquiry = next;
    tabs.forEach((tab) => {
      const selected = tab.dataset.contactType === next;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    });
    const active = tabs.find((tab) => tab.dataset.contactType === next);
    details.placeholder = active?.dataset.detailsPlaceholder || '';
    company.hidden = next !== 'PARTNERSHIP';
    subject.hidden = next !== 'GENERAL_ENQUIRY';
    privacy.hidden = next === 'GET_A_QUOTE';
    if (privacy.hidden) privacyInput.checked = false;
    setFieldError(form, 'company_name', '');
    setFieldError(form, 'subject', '');
    setFieldError(form, 'privacy', '');
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showEnquiry(tab.dataset.contactType as EnquiryType));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(index + direction + tabs.length) % tabs.length];
      next.focus();
      showEnquiry(next.dataset.contactType as EnquiryType);
    });
  });

  const setBusy = (busy: boolean) => {
    button.setAttribute('aria-busy', busy ? 'true' : 'false');
    label.textContent = busy ? t('page.contact.submitting') : t('page.contact.submit');
    updateSubmit();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    status.classList.remove('is-error', 'is-success');
    let utilsReady = true;
    try {
      await iti.promise;
    } catch {
      utilsReady = false;
    }

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const lastName = String(data.get('last_name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = details.value.trim();
    const companyName = String(data.get('company_name') || '').trim();
    const subjectValue = String(data.get('subject') || '').trim();
    const country = iti.getSelectedCountry()?.name || '';
    const phone = iti.getNumber(intlTelInput.NUMBER_FORMAT.E164);
    let valid = true;

    const requireText = (field: string, value: string, messageKey: string) => {
      const error = value ? '' : t(messageKey);
      setFieldError(form, field, error);
      if (error) valid = false;
    };

    requireText('name', name, 'page.contact.error.first_name');
    requireText('last_name', lastName, 'page.contact.error.last_name');
    if (!email) {
      setFieldError(form, 'email', t('page.contact.error.email'));
      valid = false;
    } else if (!EMAIL_PATTERN.test(email)) {
      setFieldError(form, 'email', t('page.contact.error.email_invalid'));
      valid = false;
    } else {
      setFieldError(form, 'email', '');
    }
    if (!phone) {
      setFieldError(form, 'phone_no', t('page.contact.error.phone'));
      valid = false;
    } else if (!utilsReady || iti.isValidNumber() !== true) {
      setFieldError(form, 'phone_no', t('page.contact.error.phone_invalid'));
      valid = false;
    } else {
      setFieldError(form, 'phone_no', '');
    }
    requireText('details', message, 'page.contact.error.details');
    if (visible(company)) requireText('company_name', companyName, 'page.contact.error.company');
    if (visible(subject)) requireText('subject', subjectValue, 'page.contact.error.subject');
    if (visible(privacy) && !privacyInput.checked) {
      setFieldError(form, 'privacy', t('page.contact.error.privacy'));
      valid = false;
    } else {
      setFieldError(form, 'privacy', '');
    }
    if (!captchaToken) {
      const missingKey = !siteKey && captcha.dataset.captchaDev === 'true';
      setFieldError(form, 'captcha', missingKey ? t('page.contact.error.captcha_unavailable') : t('page.contact.error.captcha'));
      valid = false;
    }

    if (!valid) {
      const invalid = form.querySelector('[aria-invalid="true"]');
      if (invalid instanceof HTMLElement) invalid.focus();
      return;
    }

    const payload: Record<string, string> = {
      contact_type: enquiry,
      name,
      last_name: lastName,
      email,
      phone_no: phone,
      country,
      details: message,
      recaptchaToken: captchaToken,
    };
    if (enquiry === 'PARTNERSHIP') payload.company_name = companyName;
    if (enquiry === 'GENERAL_ENQUIRY') payload.subject = subjectValue;

    setBusy(true);
    try {
      const response = await fetch('/api/v1/public/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.status === 201) {
        status.textContent = t('page.contact.success');
        status.classList.add('is-success');
        form.reset();
        iti.setNumber('');
        showEnquiry(enquiry);
        captchaToken = '';
        if (widgetId !== null) window.grecaptcha?.reset(widgetId);
        updateSubmit();
        return;
      }
      status.textContent =
        response.status === 400 ? t('page.contact.error.captcha') : t('page.contact.error.submit');
      status.classList.add('is-error');
      if (response.status === 400) {
        captchaToken = '';
        if (widgetId !== null) window.grecaptcha?.reset(widgetId);
        updateSubmit();
      }
    } catch {
      status.textContent = t('page.contact.error.submit');
      status.classList.add('is-error');
    } finally {
      setBusy(false);
    }
  });

  updateSubmit();
}

initContactForm();
