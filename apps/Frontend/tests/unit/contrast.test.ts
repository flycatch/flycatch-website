import { describe, expect, it } from 'vitest';

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw;
  const red = Number.parseInt(full.slice(0, 2), 16);
  const green = Number.parseInt(full.slice(2, 4), 16);
  const blue = Number.parseInt(full.slice(4, 6), 16);
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('site colour pairs', () => {
  it('meets WCAG AA for body and interface text', () => {
    expect(contrast('#000000', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#4a4a4a', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', '#000b18')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', '#000000')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', '#e50914')).toBeGreaterThanOrEqual(4.5);
  });
});
