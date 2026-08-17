import messages from '../i18n/en.json';

export function t(key: string): string {
  return (messages as Record<string, string>)[key] ?? key;
}

export function resourceLabel(id: string): string {
  const key = `admin.roles.resource.${id}`;
  const value = t(key);
  return value === key ? id : value;
}
