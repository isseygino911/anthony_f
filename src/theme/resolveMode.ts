export type ThemeMode = 'light' | 'dark';
export type DefaultMode = ThemeMode | 'auto';

const COOKIE_NAME = 'theme_mode';

function readCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

/**
 * Resolves the effective light/dark mode once per page load, per
 * architecture.md §5.3:
 *   1. cookie "theme_mode" present -> use it directly.
 *   2. else -> site_theme.default_mode ('light'/'dark' used directly,
 *      'auto' resolved via prefers-color-scheme, once).
 * Does NOT write a cookie itself — only the explicit header toggle writes it.
 */
export function resolveMode(defaultMode: DefaultMode): ThemeMode {
  const cookieValue = readCookie(COOKIE_NAME);
  if (cookieValue === 'dark' || cookieValue === 'light') {
    return cookieValue;
  }

  if (defaultMode === 'light' || defaultMode === 'dark') {
    return defaultMode;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyMode(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-mode', mode);
}

/** Explicit user toggle only: flips the DOM attribute and writes the cookie directly, no server round-trip. */
export function setModeCookie(mode: ThemeMode): void {
  applyMode(mode);
  document.cookie = `${COOKIE_NAME}=${mode}; Max-Age=31536000; Path=/; SameSite=Lax`;
}
