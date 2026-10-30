const ALLOWED = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4',
  'blockquote', 'hr', 'span', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|svg|math|form|textarea|select)\b[\s\S]*?<\/\1\s*>/gi;

const escapeAttr = (value: string) => value.replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/"/g, '&quot;');

function safeHref(raw: string): string | null {
  const href = raw.replace(/[\u0000- ]/g, '');
  return /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? raw.trim() : null;
}

/**
 * Reduces HRMS rich-text HTML to a small allowlist of structural tags. Headings are
 * shifted down a level because the page title is the only h1/h2 on the detail page.
 */
export function renderRichText(html: string | null | undefined): string {
  const safe = sanitize(html);
  return /<(ul|ol|li|h[2-4])\b/.test(safe) ? safe : restructure(safe);
}

function sanitize(html: string | null | undefined): string {
  if (!html) return '';
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '').replace(DROP_WITH_CONTENT, '');
  return cleaned.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (tag, name: string, attrs: string) => {
    const lower = name.toLowerCase();
    if (!ALLOWED.has(lower)) return '';
    const closing = tag.startsWith('</');
    const out = lower === 'h1' ? 'h2' : lower === 'h2' ? 'h3' : lower;
    if (closing) return `</${out}>`;
    if (lower === 'a') {
      const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
      const safe = href ? safeHref(href[1] ?? href[2] ?? '') : null;
      return safe ? `<a href="${escapeAttr(safe)}" rel="noopener noreferrer" target="_blank">` : '<a>';
    }
    return `<${out}>`;
  });
}

const BULLET = /^\s*(?:[•·▪●◦*]|[-–—])\s+/;
const plain = (line: string) => line.replace(/<[^>]+>/g, '').trim();

/**
 * Descriptions pasted from a document arrive as one paragraph of <br>-separated lines with
 * literal bullet characters. Rebuild lists, subheadings and paragraphs from those lines.
 */
function restructure(html: string): string {
  const lines = html
    .replace(/<\/p>\s*<p>/g, '<br>')
    .replace(/<\/?p>/g, '')
    .split(/<br\s*\/?>/)
    .map((line) => line.trim())
    .filter(Boolean);
  const out: string[] = [];
  let items: string[] = [];
  const flush = () => {
    if (items.length) out.push(`<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`);
    items = [];
  };
  for (const line of lines) {
    if (BULLET.test(plain(line))) {
      items.push(line.replace(BULLET, ''));
      continue;
    }
    flush();
    const text = plain(line);
    const heading = text.length <= 60 && !/[.!?]$/.test(text) && !/:\s*\S/.test(text);
    out.push(heading ? `<h3>${line.replace(/:\s*$/, '')}</h3>` : `<p>${line}</p>`);
  }
  flush();
  return out.join('');
}
