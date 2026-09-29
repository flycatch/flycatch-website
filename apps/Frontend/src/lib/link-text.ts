import { t } from './i18n';

/** Phrases Lighthouse SEO link-text audit treats as non-descriptive (English). */
const NON_DESCRIPTIVE_LINK_TEXTS = new Set([
  'click here',
  'click this',
  'go',
  'here',
  'information',
  'learn more',
  'more',
  'more info',
  'more information',
  'right here',
  'read more',
  'see more',
  'start',
  'this',
]);

export function isNonDescriptiveLinkText(label: string): boolean {
  return NON_DESCRIPTIVE_LINK_TEXTS.has(label.trim().toLowerCase());
}

/**
 * When the visible label is a generic phrase (e.g. "Read more"), return the
 * suffix after that phrase from `home.read_more_about` so it can be rendered
 * in a visually-hidden span. Returns null when the label is already descriptive.
 */
export function descriptiveLinkSuffix(label: string, title: string): string | null {
  const trimmed = label.trim();
  if (!isNonDescriptiveLinkText(trimmed)) return null;

  const full = t('home.read_more_about', { title });
  const lowerFull = full.toLowerCase();
  const lowerLabel = trimmed.toLowerCase();
  if (lowerFull.startsWith(lowerLabel)) {
    return full.slice(trimmed.length);
  }
  return ` about ${title}`;
}
