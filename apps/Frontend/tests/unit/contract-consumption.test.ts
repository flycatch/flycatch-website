import { describe, expect, it } from 'vitest';
import { loadPublishedSnapshot } from '../../src/lib/published-snapshot';

describe('contract consumption', () => {
  it('loads snapshot with required fields', () => {
    const snapshot = loadPublishedSnapshot();
    expect(snapshot.revision).toBeTruthy();
    expect(snapshot.site_settings.site_name).toBeTruthy();
    expect(snapshot.pages.length).toBeGreaterThan(0);
  });
});
