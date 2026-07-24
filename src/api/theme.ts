import { api } from './client';
import type { SectionKey, SectionStyle, SiteTheme, SocialLinks, ThemeResponse } from '../types';

export function getTheme() {
  return api.get<ThemeResponse>('/theme');
}

export interface ThemeSaveInput {
  brand_name?: string;
  tagline?: string;
  logo_url?: string;
  palette_id?: string;
  custom_colors?: { primary: string; secondary: string };
  section_styles?: Record<SectionKey, SectionStyle>;
  social_links?: SocialLinks;
  default_mode?: 'light' | 'dark' | 'auto';
  tax_rate_percent?: number;
}

export function saveTheme(input: ThemeSaveInput) {
  return api.put<SiteTheme>('/admin/theme', input);
}

export function uploadLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api.postForm<{ logo_url: string }>('/admin/theme/logo', formData);
}
