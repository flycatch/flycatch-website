import { describe, expect, it } from 'vitest';
import { descriptiveLinkSuffix, isNonDescriptiveLinkText } from '../../src/lib/link-text';

describe('link-text', () => {
  it('flags Lighthouse blocklisted phrases', () => {
    expect(isNonDescriptiveLinkText('Read more')).toBe(true);
    expect(isNonDescriptiveLinkText('READ MORE')).toBe(true);
    expect(isNonDescriptiveLinkText('Know more')).toBe(false);
    expect(isNonDescriptiveLinkText('Watch the webinar')).toBe(false);
  });

  it('returns a hidden suffix for generic labels', () => {
    expect(descriptiveLinkSuffix('Read more', 'Acme launch')).toBe(' about Acme launch');
    expect(descriptiveLinkSuffix('Watch the webinar', 'Acme launch')).toBeNull();
  });
});
