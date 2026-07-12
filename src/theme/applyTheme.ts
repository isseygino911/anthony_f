import { contrastForeground, shiftLightness } from './colorUtils';

export interface ResolvedColors {
  primary: string;
  secondary: string;
}

/**
 * Writes --brand-primary/--brand-secondary + derived tints to :root
 * (architecture.md §5.1). Used both at boot (ThemeProvider, real server
 * values) and for admin live preview (ThemeSettings, in-memory draft values
 * — see §5.4). Never persists anything; purely a DOM side effect.
 */
export function applyTheme(colors: ResolvedColors): void {
  const root = document.documentElement.style;
  root.setProperty('--brand-primary', colors.primary);
  root.setProperty('--brand-secondary', colors.secondary);
  root.setProperty('--brand-primary-tint-10', shiftLightness(colors.primary, 40));
  root.setProperty('--brand-primary-tint-90', shiftLightness(colors.primary, -35));
  root.setProperty('--brand-primary-hover', shiftLightness(colors.primary, -8));
  root.setProperty('--brand-primary-active', shiftLightness(colors.primary, -16));
  root.setProperty('--brand-foreground', contrastForeground(colors.primary));
}
