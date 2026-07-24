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

export interface CreateDesignInput {
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

// Public — no auth required. Used by the landing page gallery.
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
