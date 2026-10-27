import { friendlyError, type ApiError } from '../lib/careers-form';

type CandidateApplication = {
  ref: string;
  openingTitle: string;
  appliedAt: string;
  status: string;
  canWithdraw: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function initJobStatus() {
  const root = document.querySelector('[data-job-status]');
  if (!(root instanceof HTMLElement) || root.dataset.statusReady === 'true') return;
  root.dataset.statusReady = 'true';
  const endpoint = root.dataset.endpoint ?? '/careers-api';

  const login = root.querySelector<HTMLFormElement>('[data-status-login]');
  const codeField = root.querySelector<HTMLElement>('[data-status-code-field]');
  const error = root.querySelector<HTMLElement>('[data-status-error]');
  const info = root.querySelector<HTMLElement>('[data-status-info]');
  const submit = root.querySelector<HTMLButtonElement>('[data-status-submit]');
  const label = root.querySelector<HTMLElement>('[data-status-label]');
  const results = root.querySelector<HTMLElement>('[data-status-results]');
  const list = root.querySelector<HTMLElement>('[data-status-list]');
  const empty = root.querySelector<HTMLElement>('[data-status-empty]');
  const deleteButton = root.querySelector<HTMLButtonElement>('[data-status-delete]');
  const actionError = root.querySelector<HTMLElement>('[data-status-action-error]');
  const actionInfo = root.querySelector<HTMLElement>('[data-status-action-info]');
  if (!login || !codeField || !error || !info || !submit || !label || !results || !list || !empty || !deleteButton || !actionError || !actionInfo) return;

  let token = '';
  let codeSent = false;

  const render = (apps: CandidateApplication[]) => {
    list.replaceChildren();
    empty.hidden = apps.length > 0;
    for (const app of apps) {
      const item = document.createElement('li');
      item.className = 'jobs-status-item';
      const title = document.createElement('strong');
      title.textContent = app.openingTitle;
      const meta = document.createElement('span');
      meta.textContent = `${app.ref} · Applied ${new Date(app.appliedAt).toLocaleDateString()} · ${app.status}`;
      item.append(title, meta);
      if (app.canWithdraw) {
        const withdraw = document.createElement('button');
        withdraw.type = 'button';
        withdraw.className = 'jobs-apply-secondary';
        withdraw.textContent = 'Withdraw application';
        let armed = false;
        withdraw.addEventListener('click', async () => {
          if (!armed) {
            armed = true;
            withdraw.textContent = 'Click again to confirm withdrawal';
            return;
          }
          actionError.textContent = '';
          withdraw.disabled = true;
          const result = await call<CandidateApplication>(`${endpoint}/applications/${encodeURIComponent(app.ref)}/withdraw`, {
            method: 'POST',
            headers: { 'X-Candidate-Token': token },
          });
          if (!result.ok) {
            withdraw.disabled = false;
            armed = false;
            withdraw.textContent = 'Withdraw application';
            actionError.textContent = friendlyError(result.error).message;
            return;
          }
          meta.textContent = `${app.ref} · Applied ${new Date(app.appliedAt).toLocaleDateString()} · ${result.data.status}`;
          withdraw.remove();
        });
        item.append(withdraw);
      }
      list.append(item);
    }
  };

  const loadStatus = async () => {
    const result = await call<CandidateApplication[]>(`${endpoint}/status`, { headers: { 'X-Candidate-Token': token } });
    if (!result.ok) {
      token = '';
      error.textContent = friendlyError(result.error).message;
      return;
    }
    login.hidden = true;
    results.hidden = false;
    render(result.data);
  };

  login.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    error.textContent = '';
    const email = (login.elements.namedItem('email') as HTMLInputElement).value.trim();
    if (!EMAIL_PATTERN.test(email)) {
      error.textContent = 'Enter a valid email address.';
      return;
    }
    submit.disabled = true;
    if (!codeSent) {
      const result = await call(`${endpoint}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'status' }),
      });
      submit.disabled = false;
      if (!result.ok) {
        error.textContent = friendlyError(result.error).message;
        return;
      }
      codeSent = true;
      codeField.hidden = false;
      label.textContent = 'View my applications';
      info.textContent = 'If this email has applied, a code is on its way. It is valid for 10 minutes.';
      (login.elements.namedItem('code') as HTMLInputElement).focus();
      return;
    }
    const code = (login.elements.namedItem('code') as HTMLInputElement).value.trim();
    if (!/^\d{6}$/.test(code)) {
      submit.disabled = false;
      error.textContent = 'Enter the 6-digit code.';
      return;
    }
    const verified = await call<{ token: string }>(`${endpoint}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, purpose: 'status' }),
    });
    if (!verified.ok) {
      submit.disabled = false;
      error.textContent = friendlyError(verified.error).message;
      return;
    }
    token = verified.data.token;
    await loadStatus();
    submit.disabled = false;
  });

  let deleteArmed = false;
  deleteButton.addEventListener('click', async () => {
    actionError.textContent = '';
    if (!deleteArmed) {
      deleteArmed = true;
      deleteButton.textContent = 'Click again to confirm deletion request';
      return;
    }
    deleteButton.disabled = true;
    const result = await call<{ requested: boolean; created: boolean }>(`${endpoint}/data-deletion`, {
      method: 'POST',
      headers: { 'X-Candidate-Token': token },
    });
    if (!result.ok) {
      deleteButton.disabled = false;
      deleteArmed = false;
      deleteButton.textContent = 'Request deletion of my data';
      actionError.textContent = friendlyError(result.error).message;
      return;
    }
    deleteButton.hidden = true;
    actionInfo.textContent = result.data.created
      ? 'Your deletion request has been recorded. Our team will confirm once it is done.'
      : 'A deletion request is already open for your data.';
  });
}

initJobStatus();
