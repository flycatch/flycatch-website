import { fetchMediaBlob } from './admin-api';

export const MEDIA_SRC_PREFIX = 'media:';

const keysBySrc = new Map<string, string>();

export function rememberMediaSrc(src: string, key: string) {
  keysBySrc.set(src, key);
}

export function mediaKeyFromSrc(src: string | null): string | null {
  if (!src) return null;
  if (src.startsWith(MEDIA_SRC_PREFIX)) return src.slice(MEDIA_SRC_PREFIX.length);
  const match = src.match(/\/admin\/media\/([^/?#]+)/);
  if (match) return decodeURIComponent(match[1]);
  return keysBySrc.get(src) || null;
}

export function persistRichText(html: string): string {
  if (typeof DOMParser === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('img').forEach((img) => {
    const key = img.getAttribute('data-media-key') || mediaKeyFromSrc(img.getAttribute('src'));
    if (!key) return;
    img.setAttribute('data-media-key', key);
    img.setAttribute('src', `${MEDIA_SRC_PREFIX}${key}`);
  });
  return doc.body.innerHTML;
}

export async function hydrateRichText(html: string): Promise<string> {
  if (typeof DOMParser === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const img of Array.from(doc.querySelectorAll('img'))) {
    const key = img.getAttribute('data-media-key') || mediaKeyFromSrc(img.getAttribute('src'));
    if (!key) continue;
    img.setAttribute('data-media-key', key);
    try {
      const blob = await fetchMediaBlob(key);
      const url = URL.createObjectURL(blob);
      rememberMediaSrc(url, key);
      img.setAttribute('src', url);
    } catch {
      img.setAttribute('src', `${MEDIA_SRC_PREFIX}${key}`);
    }
  }
  return doc.body.innerHTML;
}
