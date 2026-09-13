import { apiOrigin, fetchOrigin } from './public-api';

export function resolveMediaSrc(src: string, origin = fetchOrigin() || apiOrigin()): string | URL {
  const value = src.trim();
  if (!value) return value;
  if (value.startsWith('https://') || value.startsWith('http://')) {
    return new URL(value);
  }
  if (value.startsWith('/api/')) {
    return new URL(value, `${origin.replace(/\/$/, '')}/`);
  }
  return value;
}

export function isRemoteMedia(src: string | URL): src is URL {
  return src instanceof URL;
}

export function imageAlt(value: string | null | undefined, fallback: string): string {
  const alt = (value ?? '').trim();
  return alt || fallback.trim();
}
