import messages from '../i18n/en.json';

const catalog = messages as Record<string, string>;

export function t(key: string): string {
  return catalog[key] ?? key;
}
