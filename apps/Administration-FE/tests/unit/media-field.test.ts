import { describe, expect, it } from 'vitest';
import { IMAGE_ACCEPT, LOGO_IMAGE_ACCEPT, fileMatchesAccept } from '../../src/components/MediaField';

describe('image accept', () => {
  it('keeps raster types and allows svg on the shared image accept list', () => {
    expect(IMAGE_ACCEPT).toContain('image/jpeg');
    expect(IMAGE_ACCEPT).toContain('image/png');
    expect(IMAGE_ACCEPT).toContain('image/gif');
    expect(IMAGE_ACCEPT).toContain('image/webp');
    expect(IMAGE_ACCEPT).toContain('image/svg+xml');
    expect(IMAGE_ACCEPT).toContain('.svg');
    expect(LOGO_IMAGE_ACCEPT).toBe(IMAGE_ACCEPT);
  });

  it('accepts svg by mime or extension and still accepts png', () => {
    expect(
      fileMatchesAccept(new File(['<svg />'], 'acme.svg', { type: 'image/svg+xml' }), IMAGE_ACCEPT),
    ).toBe(true);
    expect(fileMatchesAccept(new File(['<svg />'], 'acme.svg', { type: '' }), IMAGE_ACCEPT)).toBe(true);
    expect(fileMatchesAccept(new File(['png'], 'logo.png', { type: 'image/png' }), IMAGE_ACCEPT)).toBe(
      true,
    );
    expect(
      fileMatchesAccept(new File(['pdf'], 'doc.pdf', { type: 'application/pdf' }), IMAGE_ACCEPT),
    ).toBe(false);
  });
});
