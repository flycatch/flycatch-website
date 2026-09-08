import { describe, expect, it } from 'vitest';
import { IMAGE_ACCEPT, LOGO_IMAGE_ACCEPT, fileMatchesAccept } from '../../src/components/MediaField';

describe('logo image accept', () => {
  it('keeps raster types and adds svg for client logos', () => {
    expect(LOGO_IMAGE_ACCEPT).toContain('image/jpeg');
    expect(LOGO_IMAGE_ACCEPT).toContain('image/png');
    expect(LOGO_IMAGE_ACCEPT).toContain('image/webp');
    expect(LOGO_IMAGE_ACCEPT).toContain('image/svg+xml');
    expect(LOGO_IMAGE_ACCEPT).toContain('.svg');
    expect(IMAGE_ACCEPT).not.toContain('image/svg+xml');
  });

  it('accepts svg by mime or extension and still accepts png', () => {
    expect(
      fileMatchesAccept(new File(['<svg />'], 'acme.svg', { type: 'image/svg+xml' }), LOGO_IMAGE_ACCEPT),
    ).toBe(true);
    expect(fileMatchesAccept(new File(['<svg />'], 'acme.svg', { type: '' }), LOGO_IMAGE_ACCEPT)).toBe(
      true,
    );
    expect(
      fileMatchesAccept(new File(['png'], 'logo.png', { type: 'image/png' }), LOGO_IMAGE_ACCEPT),
    ).toBe(true);
    expect(
      fileMatchesAccept(new File(['pdf'], 'doc.pdf', { type: 'application/pdf' }), LOGO_IMAGE_ACCEPT),
    ).toBe(false);
  });
});
