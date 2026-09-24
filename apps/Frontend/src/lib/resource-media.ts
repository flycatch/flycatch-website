import { youtubeEmbedUrl } from './news-media';
import { publicMediaUrl } from './public-api';

function httpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.href;
  } catch {
    return null;
  }
}

export function resourceAssetUrl(key: string | null | undefined): string | null {
  const raw = key?.trim();
  if (!raw) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return httpUrl(raw);
  return publicMediaUrl(raw);
}

export function youtubeThumbnailUrl(value: string | null | undefined): string | null {
  const embed = youtubeEmbedUrl(value);
  if (!embed) return null;
  let id = '';
  try {
    id = new URL(embed).pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    return null;
  }
  if (!id) return null;
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}

export function resourceThumbnailUrl(imageKey: string | null | undefined): string | null {
  return youtubeThumbnailUrl(imageKey) || resourceAssetUrl(imageKey);
}
