/**
 * Small HSL lighten/darken color utility used only by applyTheme.ts to derive
 * tints/hover/active shades from the two server-resolved brand colors. No
 * additional colors are ever fetched from the server (architecture.md §5.1).
 */

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): Hsl {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hslToString({ h, s, l }: Hsl): string {
  return `hsl(${h.toFixed(1)} ${clamp(s, 0, 100).toFixed(1)}% ${clamp(l, 0, 100).toFixed(1)}%)`;
}

/** Lighten (positive amount) or darken (negative amount) a hex color, in HSL lightness points. */
export function shiftLightness(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  return hslToString({ ...hsl, l: clamp(hsl.l + amount, 0, 100) });
}

// WCAG relative luminance (not HSL lightness) — HSL treats every fully
// saturated hue as 50% lightness regardless of how bright it actually looks
// (pure yellow and pure blue both compute to l=50%), so it misjudges bright
// hues like neon yellow/lime as "needs white text" when they need dark text.
// Relative luminance weights each channel by how much it contributes to
// perceived brightness (green >> red >> blue), which gets this right.
function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Picks black or white foreground text for a given background hex, for contrast. */
export function contrastForeground(hex: string): string {
  return relativeLuminance(hex) > 0.5 ? '#0f172a' : '#ffffff';
}
