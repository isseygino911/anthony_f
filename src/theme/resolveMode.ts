export type ThemeMode = 'light' | 'dark';
export type DefaultMode = ThemeMode | 'auto';

/**
 * Resolves the effective light/dark mode once per page load, per
 * architecture.md §5.3: site_theme.default_mode ('light'/'dark' used
 * directly, 'auto' resolved via prefers-color-scheme, once). There is no
 * user-facing override — the admin-configured default (or system
 * preference when 'auto') is authoritative.
 */
export function resolveMode(defaultMode: DefaultMode): ThemeMode {
  if (defaultMode === 'light' || defaultMode === 'dark') {
    return defaultMode;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyMode(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-mode', mode);
}
