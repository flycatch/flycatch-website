import {
  attachmentFor,
  friendlyError,
  isShown,
  shapeAnswers,
  shapeStandard,
  type ApiError,
  type AttachmentSpec,
  type RawValue,
} from '../lib/careers-form';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCookie(name: string): string {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

async function call<T>(url: string, init: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  try {
    const response = await fetch(url, init);
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (response.ok) return { ok: true, data: body as T };
    return { ok: false, error: { status: response.status, ...(body as object) } as ApiError };
  } catch {
    return { ok: false, error: { status: 0 } };
  }
}

function initJobApply() {
  const root = document.querySelector('[data-job-apply]');
  if (!(root instanceof HTMLElement) || root.dataset.applyReady === 'true') return;
  root.dataset.applyReady = 'true';

  const form = root.querySelector<HTMLFormElement>('[data-apply-form]');
  const done = root.querySelector<HTMLElement>('[data-apply-done]');
  const submit = root.querySelector<HTMLButtonElement>('[data-apply-submit]');
  const label = root.querySelector<HTMLElement>('[data-apply-label]');
  if (!form || !done || !submit || !label) return;

  const endpoint = root.dataset.endpoint ?? '/careers-api';
  const openingId = root.dataset.openingId ?? '';
  const otpRequired = root.dataset.otpRequired === 'true';
  const consentVersion = root.dataset.consentVersion ?? '';

  const setError = (name: string, message: string) => {
    const el = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    if (el) el.textContent = message;
    const holder = form.querySelector<HTMLElement>(`[data-field="${name}"]`);
    holder?.querySelectorAll('input, select, textarea').forEach((input) => {
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    });
  };
  const clearErrors = () => {
    form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((el) => {
      el.textContent = '';
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.setAttribute('aria-invalid', 'false'));
  };

  const valueOf = (field: HTMLElement): RawValue => {
    const controls = [...field.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')];
    const first = controls[0];
    if (!first) return undefined;
    if (first instanceof HTMLInputElement && first.type === 'checkbox') {
      return controls.filter((c): c is HTMLInputElement => c instanceof HTMLInputElement && c.checked).map((c) => c.value);
    }
    if (first instanceof HTMLInputElement && first.type === 'radio') {
      return controls.find((c): c is HTMLInputElement => c instanceof HTMLInputElement && c.checked)?.value;
    }
    return first.value;
  };

  // Conditional questions: hidden ones are disabled so they are neither validated nor sent.
  const questions = [...form.querySelectorAll<HTMLElement>('[data-question]')];
  const applyConditions = () => {
    questions.forEach((question) => {
      const source = question.dataset.showField;
      if (!source) return;
      const controller = form.querySelector<HTMLElement>(`[data-field="${source}"]`);
      const shown = isShown(
        { field: source, equals: question.dataset.showEquals ?? '' },
        controller ? valueOf(controller) : undefined,
      );
      question.hidden = !shown;
      question.querySelectorAll<HTMLInputElement>('input, select, textarea').forEach((input) => {
        input.disabled = !shown;
      });
    });
  };
  form.addEventListener('change', applyConditions);
  applyConditions();

  // Email verification (only when the opening requires it).
  let otpToken = '';
  let otpEmail = '';
  const emailInput = form.querySelector<HTMLInputElement>('[name="email"]');
  const otpSend = form.querySelector<HTMLButtonElement>('[data-otp-send]');
  const otpVerify = form.querySelector<HTMLButtonElement>('[data-otp-verify]');
  const otpCode = form.querySelector<HTMLInputElement>('[data-otp-code]');
  const otpStatus = form.querySelector<HTMLElement>('[data-otp-status]');

  const resetOtp = () => {
    otpToken = '';
    otpEmail = '';
    if (otpStatus) otpStatus.textContent = '';
  };
  emailInput?.addEventListener('input', () => {
    if (otpToken && emailInput.value.trim().toLowerCase() !== otpEmail) resetOtp();
  });
  otpSend?.addEventListener('click', async () => {
    setError('otp', '');
    const email = emailInput?.value.trim() ?? '';
    if (!EMAIL_PATTERN.test(email)) return setError('otp', 'Enter a valid email address first.');
    otpSend.disabled = true;
    const result = await call(`${endpoint}/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'apply' }),
    });
    otpSend.disabled = false;
    if (!result.ok) return setError('otp', friendlyError(result.error).message);
    if (otpCode) otpCode.hidden = false;
    if (otpVerify) otpVerify.hidden = false;
    otpSend.textContent = 'Resend code';
    if (otpStatus) otpStatus.textContent = `If ${email} can receive mail, a code is on its way. It is valid for 10 minutes.`;
    otpCode?.focus();
  });
  otpVerify?.addEventListener('click', async () => {
    setError('otp', '');
    const email = emailInput?.value.trim() ?? '';
    const code = otpCode?.value.trim() ?? '';
    if (!/^\d{6}$/.test(code)) return setError('otp', 'Enter the 6-digit code.');
    otpVerify.disabled = true;
    const result = await call<{ token: string }>(`${endpoint}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, purpose: 'apply' }),
    });
    otpVerify.disabled = false;
    if (!result.ok) return setError('otp', friendlyError(result.error).message);
    otpToken = result.data.token;
    otpEmail = email.toLowerCase();
    if (otpStatus) otpStatus.textContent = 'Email verified.';
  });

  // Client-side checks mirror what the HRMS enforces; the HRMS stays the authority.
  const validate = (): boolean => {
    clearErrors();
    let firstBad: HTMLElement | null = null;
    const fail = (name: string, message: string, el: HTMLElement | null) => {
      setError(name, message);
      firstBad ??= el;
    };
    form.querySelectorAll<HTMLElement>('[data-field]').forEach((field) => {
      if (field.hidden) return;
      const name = field.dataset.field ?? '';
      const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
      if (!control || control.disabled) return;
      const value = valueOf(field);
      const empty = Array.isArray(value) ? value.length === 0 : !(value ?? '').toString().trim();
      if (control instanceof HTMLInputElement && control.type === 'file') {
        const file = control.files?.[0];
        if (!file) return control.required ? fail(name, 'Please choose a file.', control) : undefined;
        if (file.size > MAX_FILE_BYTES) return fail(name, 'This file is over 10 MB.', control);
        return;
      }
      if (empty) return control.required || field.querySelector('[required]') ? fail(name, 'This is required.', control) : undefined;
      if (control instanceof HTMLInputElement && control.type === 'email' && !EMAIL_PATTERN.test(control.value.trim())) {
        return fail(name, 'Enter a valid email address.', control);
      }
      if (control instanceof HTMLInputElement && control.type === 'number') {
        const n = Number(control.value);
        if (!Number.isFinite(n) || (control.min !== '' && n < Number(control.min)) || (control.max !== '' && n > Number(control.max))) {
          return fail(name, 'Enter a valid number.', control);
        }
      }
      if (control instanceof HTMLInputElement && control.pattern && !new RegExp(`^(?:${control.pattern})$`).test(control.value)) {
        return fail(name, 'This does not match the expected format.', control);
      }
    });
    const consent = form.querySelector<HTMLInputElement>('[name="consent"]');
    if (consent && !consent.checked) fail('consent', 'Consent is required to apply.', consent);
    if (otpRequired && !otpToken) fail('otp', 'Verify your email to continue.', otpSend);
    const files = [...form.querySelectorAll<HTMLInputElement>('input[type="file"]:not(:disabled)')].flatMap((i) => [...(i.files ?? [])]);
    if (files.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) fail('form', 'Your files add up to more than 25 MB.', null);
    (firstBad as HTMLElement | null)?.focus();
    return firstBad === null;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled || !validate()) return;

    const standardValues: Record<string, RawValue> = {};
    const answerSpecs: { id: string; type: string; value: RawValue }[] = [];
    const resume = form.querySelector<HTMLInputElement>('[name="resume"]')?.files?.[0];
    const extras: { file: File; spec: AttachmentSpec }[] = [];
    form.querySelectorAll<HTMLElement>('[data-field]').forEach((field) => {
      const id = field.dataset.field ?? '';
      if (id === 'resume' || field.hidden) return;
      if (field.hasAttribute('data-standard')) {
        standardValues[id] = valueOf(field);
        return;
      }
      const control = field.querySelector<HTMLInputElement>('input, select, textarea');
      if (control?.disabled) return;
      const type = control?.dataset.type ?? 'text';
      if (type === 'file' && control instanceof HTMLInputElement) {
        const file = control.files?.[0];
        if (file) extras.push({ file, spec: attachmentFor(control.dataset.kind ?? 'Other', id) });
        return;
      }
      answerSpecs.push({ id, type, value: valueOf(field) });
    });

    const source = readCookie('fc_job_source');
    const payload = {
      standard: shapeStandard(standardValues),
      answers: shapeAnswers(answerSpecs),
      consent: true,
      consentVersion,
      whatsappOptIn: form.querySelector<HTMLInputElement>('[name="whatsappOptIn"]')?.checked ?? false,
      ...(source ? { source } : {}),
      ...(otpToken ? { otpToken } : {}),
      attachments: extras.map((e) => e.spec),
    };

    const body = new FormData();
    body.append('payload', JSON.stringify(payload));
    if (resume) body.append('resume', resume);
    extras.forEach((e) => body.append('files', e.file));

    submit.disabled = true;
    const idle = label.textContent;
    label.textContent = 'Submitting';
    const result = await call<{ ref: string; email: string }>(`${endpoint}/openings/${encodeURIComponent(openingId)}/applications`, {
      method: 'POST',
      body,
    });
    submit.disabled = false;
    label.textContent = idle;

    if (result.ok) {
      done.querySelector('[data-apply-ref]')!.textContent = result.data.ref;
      done.querySelector('[data-apply-email]')!.textContent = result.data.email;
      form.hidden = true;
      done.hidden = false;
      done.focus();
      return;
    }
    const friendly = friendlyError(result.error);
    Object.entries(friendly.fields ?? {}).forEach(([name, message]) => setError(name, message));
    const general = form.querySelector<HTMLElement>('[data-error-for="form"]');
    if (general) {
      general.textContent = friendly.message;
      if (friendly.alreadyApplied) {
        const link = document.createElement('a');
        link.href = '/company/jobs-openings/status';
        link.textContent = ' Check your application status.';
        general.append(link);
      }
    }
  });
}

initJobApply();
