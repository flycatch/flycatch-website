import messages from '../i18n/en.json';

export function t(key: string): string {
  return (messages as Record<string, string>)[key] ?? key;
}
