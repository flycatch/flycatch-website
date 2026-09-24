const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function youtubeEmbedUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtube-nocookie.com') {
    return null;
  }
  const watchId = url.searchParams.get('v');
  if (url.pathname === '/watch' && watchId) {
    return `https://www.youtube.com/embed/${encodeURIComponent(watchId)}`;
  }
  const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${encodeURIComponent(match[1])}`;
}

export function formatNewsDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function newsMetaLabel(readingTime: number, createdAt: string | null | undefined): string {
  const reading = `${readingTime} min read`;
  const date = formatNewsDate(createdAt);
  return date ? `${reading} | ${date}` : reading;
}
