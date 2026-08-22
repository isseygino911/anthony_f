import { api } from './client';
import type {
  Cart,
  CustomNeonColor,
  CustomNeonDesign,
  DesignType,
  NeonColor,
  NeonPresetColor,
  NeonSize,
  Paginated,
} from '../types';

// Single source of truth for the size -> physical dimension label, shared by
// the storefront designer (paired with pricing) and the admin views (shown
// as-is) so the two never drift apart.
export const NEON_SIZE_LABELS: Record<NeonSize, string> = {
  small: '12"x12"',
  medium: '24"x24"',
  large: '36"x36"',
};

// Mirrors SIZE_PRICES in server/src/services/customNeonDesign.service.js.
// The server is authoritative for what a customer is actually charged; these
// are for display and for prefilling the admin publish form.
// Colour has no effect on price — only size does.
export const NEON_SIZE_PRICES: Record<NeonSize, number> = {
  small: 249.99,
  medium: 399.99,
  large: 524.99,
};

// Swatches approximate the lit tube colour so the picker previews the result.
// Each value must exist in NEON_COLORS (backend validation) and COLOR_LABELS
// (the Gemini prompt wording) — see customNeonDesign.service.js. Customers can
// also pick a colour outside this list; those travel as `custom:#rrggbb`.
export const NEON_PRESETS: { value: NeonPresetColor; label: string; swatch: string }[] = [
  { value: 'amber', label: 'Amber', swatch: '#f5b400' },
  { value: 'pink', label: 'Pink', swatch: '#ec4899' },
  { value: 'blue', label: 'Blue', swatch: '#38bdf8' },
  { value: 'white', label: 'White', swatch: '#f8fafc' },
  { value: 'red', label: 'Red', swatch: '#ef4444' },
  { value: 'green', label: 'Green', swatch: '#22c55e' },
  { value: 'purple', label: 'Purple', swatch: '#a855f7' },
  { value: 'orange', label: 'Orange', swatch: '#fb923c' },
  { value: 'ice-blue', label: 'Ice Blue', swatch: '#a5f3fc' },
  { value: 'warm-white', label: 'Warm White', swatch: '#fef3c7' },
];

// Must stay in sync with CUSTOM_COLOR_RE in
// anthony_b/src/services/customNeonDesign.service.js — the backend rejects
// anything else with 400 Invalid neon_color, so a mismatch here surfaces to the
// customer as a failed Generate rather than as a wrong colour.
export const CUSTOM_COLOR_RE = /^custom:#[0-9a-f]{6}$/;

export const DEFAULT_CUSTOM_HEX = '#ff2d95';

export function isCustomNeonColor(value: NeonColor | null | undefined): value is CustomNeonColor {
  return typeof value === 'string' && CUSTOM_COLOR_RE.test(value);
}

/** '#RRGGBB' | '#rgb' | 'RRGGBB' -> canonical lowercase '#rrggbb', or null. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

/** Canonical encoded value for the wire, or null if the hex is unusable. */
export function toCustomNeonColor(hex: string): CustomNeonColor | null {
  const normalized = normalizeHex(hex);
  return normalized ? (`custom:${normalized}` as CustomNeonColor) : null;
}

/** The bare '#rrggbb' of a custom value, or null for presets. */
export function customHexOf(value: NeonColor | null | undefined): string | null {
  return isCustomNeonColor(value) ? value.slice('custom:'.length) : null;
}

/** The CSS colour to paint a swatch with, for presets and custom alike. */
export function neonSwatchHex(value: NeonColor | null | undefined): string {
  const hex = customHexOf(value);
  if (hex) return hex;
  return NEON_PRESETS.find((preset) => preset.value === value)?.swatch ?? 'transparent';
}

// Display-ready label for every read-only surface (order text, My Designs, the
// admin views). Returns 'Custom #FF2D95' rather than the raw stored token, so
// callers must not add a `capitalize` class on top of it. Mirrors
// describeColorForCustomer() in customNeonDesign.service.js.
export function formatNeonColor(value: NeonColor | null | undefined): string {
  if (!value) return '—';
  const hex = customHexOf(value);
  if (hex) return `Custom ${hex.toUpperCase()}`;
  return NEON_PRESETS.find((preset) => preset.value === value)?.label ?? value;
}

// The colour fragment used inside a product description. Must produce byte-for-byte
// the same text as describeColorForCustomer() in customNeonDesign.service.js: the
// admin publish form prefills the description client-side, and the server writes it
// on confirm, so any divergence shows up as two different descriptions for one
// design. Presets stay as their raw slug ('ice-blue'), custom picks read
// 'custom #FF2D95'.
export function describeNeonColorForDescription(value: NeonColor | null | undefined): string {
  const hex = customHexOf(value);
  return hex ? `custom ${hex.toUpperCase()}` : (value ?? '');
}

interface CreateDesignInput {
  designType: DesignType;
  file: File;
  strokes?: unknown;
  text?: string;
  fontFamily?: string;
  size: NeonSize;
  neonColor: NeonColor;
}

export function createDesign(input: CreateDesignInput) {
  const formData = new FormData();
  formData.append('design_type', input.designType);
  formData.append('file', input.file);
  formData.append('size', input.size);
  formData.append('neon_color', input.neonColor);
  if (input.strokes !== undefined) formData.append('strokes', JSON.stringify(input.strokes));
  if (input.text) formData.append('text', input.text);
  if (input.fontFamily) formData.append('font_family', input.fontFamily);
  return api.postForm<CustomNeonDesign>('/custom-neon-designs', formData);
}

export function getDesign(id: number) {
  return api.get<CustomNeonDesign>(`/custom-neon-designs/${id}`);
}

// The current user's in-flight (pending/processing) design, if any — used to
// reattach to a generation in progress after a refresh/new tab, and to power
// the site-wide "generating" indicator.
export function getActiveDesign() {
  return api.get<{ design: CustomNeonDesign | null }>('/custom-neon-designs/active');
}

// "My Designs" account page — every design the current user has ever
// generated, any status.
export function listMyDesigns(query: { page?: number; pageSize?: number } = {}) {
  return api.get<Paginated<CustomNeonDesign>>('/custom-neon-designs', { ...query });
}

export interface ShowcaseDesign {
  id: number;
  label: string;
  dimensions: string | null;
  imageUrl: string;
}

// Studio example work, shown permanently rather than as a fallback — these are
// what the galleries are *for*, and they no longer get swapped out when
// customer designs load. Admin-promoted designs live in their own section
// instead (see CommunityCreations in pages/storefront/CustomNeon.tsx).
// Negative ids keep them from colliding with real design ids in React keys.
export const EXAMPLE_DESIGNS: ShowcaseDesign[] = [
  { id: -1, label: 'Eevee outline · cyan', dimensions: '12"x12"', imageUrl: '/assets/neon-gallery-1.png' },
  { id: -2, label: 'Jigglypuff outline · pink', dimensions: '24"x24"', imageUrl: '/assets/neon-gallery-2.png' },
  { id: -3, label: 'Gengar outline · purple', dimensions: '36"x36"', imageUrl: '/assets/neon-gallery-3.png' },
  { id: -4, label: 'Charmander outline · orange', dimensions: '24"x24"', imageUrl: '/assets/neon-gallery-4.png' },
  { id: -5, label: 'Pikachu outline · yellow', dimensions: '12"x12"', imageUrl: '/assets/neon-gallery-5.png' },
];

// Public — no auth required. Returns only admin-promoted (is_showcased)
// designs, so an empty list is the normal state before any curation.
export function getShowcaseDesigns(limit = 10) {
  return api.get<{ items: ShowcaseDesign[] }>('/custom-neon-designs/showcase', { limit });
}

// Passing size/neonColor updates the design's stored values before it
// re-queues, so changing either in the UI and hitting "Re-run AI preview"
// regenerates using the new values instead of the ones from the first run.
export function regenerateDesign(id: number, input?: { size: NeonSize; neon_color: NeonColor }) {
  return api.post<CustomNeonDesign>(`/custom-neon-designs/${id}/regenerate`, input);
}

// Takes no size/color — the server always uses whatever was last generated
// with, so the purchased product can never drift from the preview the
// customer actually saw.
export function confirmDesign(id: number) {
  return api.post<{ design: CustomNeonDesign; cart: Cart }>(`/custom-neon-designs/${id}/confirm`);
}
