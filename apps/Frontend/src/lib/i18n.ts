import messages from '../i18n/en.json';

const catalog = messages as Record<string, string>;

export function t(key: string, vars?: Record<string, string | number>): string {
  let value = catalog[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}
