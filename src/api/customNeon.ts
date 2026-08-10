import { api } from './client';
import type { Cart, CustomNeonDesign, DesignType, NeonColor, NeonSize, Paginated } from '../types';

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
export const NEON_SIZE_PRICES: Record<NeonSize, number> = {
  small: 249.99,
  medium: 399.99,
  large: 524.99,
};

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
