import { api } from './client';
import type { Cart, CustomNeonDesign, DesignType, NeonColor, NeonSize } from '../types';

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
