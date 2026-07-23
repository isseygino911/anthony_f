/**
 * Single source of truth for preset palette definitions (architecture.md §0, §3).
 *
 * The server only mirrors these palette IDs (server/src/config/palettes.js) for
 * validating `site_theme.palette_id` — it never re-derives the actual color
 * values. This file is authoritative for those values. If a palette is added,
 * removed, or its colors change, this is the only file that needs editing on
 * the client; the server-side ID list must be kept in sync separately by the
 * backend engineer.
 *
 * Each palette resolves to exactly two colors — `accent` (primary) and
 * `accentSecondary` (secondary) — matching plan §6.2's `{accent, accentSecondary}`
 * shape. `theme.service.js` on the server resolves `palette_id` -> these two
 * values (or `custom_colors` when `palette_id === 'custom'`) and always returns
 * the already-resolved pair as `resolvedColors` — the client never needs this
 * file to *apply* a theme, only to *offer choices* in the admin theme picker.
 */

export interface Palette {
  id: string;
  label: string;
  accent: string;
  accentSecondary: string;
}

export const PALETTES: Palette[] = [
  { id: 'ocean', label: 'Ocean', accent: '#0369a1', accentSecondary: '#06b6d4' },
  { id: 'sunset', label: 'Sunset', accent: '#ea580c', accentSecondary: '#db2777' },
  { id: 'earth', label: 'Earth', accent: '#78350f', accentSecondary: '#ca8a04' },
  { id: 'forest', label: 'Forest', accent: '#166534', accentSecondary: '#65a30d' },
  { id: 'berry', label: 'Berry', accent: '#9d174d', accentSecondary: '#7c3aed' },
  { id: 'slate', label: 'Slate', accent: '#334155', accentSecondary: '#64748b' },
  { id: 'graphite', label: 'Graphite', accent: '#111111', accentSecondary: '#707072' },
  { id: 'neon', label: 'Neon Glow', accent: '#e6ff00', accentSecondary: '#bdd200' },
];

export const CUSTOM_PALETTE_ID = 'custom';

export function getPaletteById(id: string): Palette | undefined {
  return PALETTES.find((p) => p.id === id);
}
