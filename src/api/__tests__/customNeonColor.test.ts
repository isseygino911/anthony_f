// The custom neon colour encoding. The client and the server each carry their
// own copy of the `custom:#rrggbb` rule (CUSTOM_COLOR_RE here and in
// anthony_b/src/services/customNeonDesign.service.js), so the parity case below
// is what stops the two drifting apart — a one-sided edit would otherwise reach
// a customer as a failed Generate rather than as a failing test.
import { describe, it, expect } from 'vitest';
import {
  CUSTOM_COLOR_RE,
  customHexOf,
  describeNeonColorForDescription,
  formatNeonColor,
  isCustomNeonColor,
  neonSwatchHex,
  normalizeHex,
  toCustomNeonColor,
} from '../customNeon';

describe('normalizeHex', () => {
  it('canonicalises to lowercase 6-digit form', () => {
    expect(normalizeHex('#FF2D95')).toBe('#ff2d95');
    expect(normalizeHex('ff2d95')).toBe('#ff2d95');
    expect(normalizeHex('  #FF2D95  ')).toBe('#ff2d95');
  });

  it('expands 3-digit shorthand', () => {
    expect(normalizeHex('#f0a')).toBe('#ff00aa');
  });

  it('returns null for anything unusable', () => {
    for (const input of ['', '#', 'red', '#gg0000', '#ff2d9', '#ff2d95ff']) {
      expect(normalizeHex(input)).toBeNull();
    }
  });
});

describe('toCustomNeonColor', () => {
  it('encodes a hex into the wire form', () => {
    expect(toCustomNeonColor('#FF2D95')).toBe('custom:#ff2d95');
  });

  it('stays well inside the varchar(32) neon_color column', () => {
    expect(toCustomNeonColor('#ff2d95')!.length).toBe(14);
  });

  it('refuses to encode an unparseable hex', () => {
    expect(toCustomNeonColor('nope')).toBeNull();
  });
});

describe('isCustomNeonColor / customHexOf', () => {
  it('recognises only the canonical lowercase form', () => {
    expect(isCustomNeonColor('custom:#ff2d95')).toBe(true);
    // Uppercase is not canonical — the server normalises before storing, so a
    // value in this shape should never come back from the API.
    expect(isCustomNeonColor('custom:#FF2D95' as never)).toBe(false);
    expect(isCustomNeonColor('custom:' as never)).toBe(false);
    expect(isCustomNeonColor('amber')).toBe(false);
    expect(isCustomNeonColor(null)).toBe(false);
  });

  it('extracts the bare hex, and nothing for presets', () => {
    expect(customHexOf('custom:#ff2d95')).toBe('#ff2d95');
    expect(customHexOf('amber')).toBeNull();
  });
});

describe('neonSwatchHex', () => {
  it('paints presets from the preset table and custom values from their hex', () => {
    expect(neonSwatchHex('amber')).toBe('#f5b400');
    expect(neonSwatchHex('custom:#ff2d95')).toBe('#ff2d95');
  });
});

describe('formatNeonColor', () => {
  it('labels presets and custom picks for display', () => {
    expect(formatNeonColor('ice-blue')).toBe('Ice Blue');
    expect(formatNeonColor('custom:#ff2d95')).toBe('Custom #FF2D95');
    expect(formatNeonColor(null)).toBe('—');
  });

  it('never returns the raw stored token', () => {
    expect(formatNeonColor('custom:#ff2d95')).not.toContain('custom:');
  });
});

describe('describeNeonColorForDescription', () => {
  // Must match describeColorForCustomer() in customNeonDesign.service.js
  // byte-for-byte: the admin publish form prefills the product description
  // client-side while the server writes it on confirm.
  it('matches the wording the server writes into a product description', () => {
    expect(describeNeonColorForDescription('custom:#ff2d95')).toBe('custom #FF2D95');
    expect(describeNeonColorForDescription('ice-blue')).toBe('ice-blue');
    expect(describeNeonColorForDescription('amber')).toBe('amber');
  });
});

describe('cross-repo parity', () => {
  it('uses the same pattern as CUSTOM_COLOR_RE in customNeonDesign.service.js', () => {
    expect(CUSTOM_COLOR_RE.source).toBe('^custom:#[0-9a-f]{6}$');
    expect(CUSTOM_COLOR_RE.flags).toBe('');
  });
});
