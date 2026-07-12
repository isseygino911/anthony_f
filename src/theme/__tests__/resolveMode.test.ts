// Path 4/4: dark/light/auto mode resolution — architecture.md §5.3.
// Priority: cookie "theme_mode" -> default_mode ('light'/'dark' direct,
// 'auto' resolved via prefers-color-scheme ONCE) -> never write a cookie
// merely from resolution (only the explicit header toggle writes it).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveMode, applyMode, setModeCookie } from '../resolveMode';

function setCookie(value: string | null) {
  // Clear any existing theme_mode cookie, then optionally set a new one.
  document.cookie = 'theme_mode=; Max-Age=0; Path=/';
  if (value !== null) {
    document.cookie = `theme_mode=${value}; Path=/`;
  }
}

function mockPrefersDark(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? matches : false,
    media: query,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  setCookie(null);
  document.documentElement.removeAttribute('data-mode');
});

describe('resolveMode', () => {
  it('uses the cookie directly when theme_mode=dark is present, regardless of default_mode', () => {
    setCookie('dark');
    expect(resolveMode('light')).toBe('dark');
  });

  it('uses the cookie directly when theme_mode=light is present, regardless of default_mode', () => {
    setCookie('light');
    expect(resolveMode('dark')).toBe('light');
  });

  it('falls back to default_mode="light" when no cookie is present', () => {
    expect(resolveMode('light')).toBe('light');
  });

  it('falls back to default_mode="dark" when no cookie is present', () => {
    expect(resolveMode('dark')).toBe('dark');
  });

  it('resolves default_mode="auto" via prefers-color-scheme when the OS prefers dark', () => {
    mockPrefersDark(true);
    expect(resolveMode('auto')).toBe('dark');
  });

  it('resolves default_mode="auto" via prefers-color-scheme when the OS prefers light', () => {
    mockPrefersDark(false);
    expect(resolveMode('auto')).toBe('light');
  });

  it('ignores a malformed/unexpected cookie value and falls through to default_mode', () => {
    setCookie('banana');
    expect(resolveMode('light')).toBe('light');
  });

  it('does NOT write a cookie merely from resolving "auto" (only the explicit toggle writes one)', () => {
    mockPrefersDark(true);
    const cookieBefore = document.cookie;

    resolveMode('auto');

    // Resolution must not add/change a theme_mode=dark|light cookie value —
    // only setModeCookie (the header toggle) is allowed to write one.
    expect(document.cookie).toBe(cookieBefore);
    expect(document.cookie).not.toContain('theme_mode=dark');
    expect(document.cookie).not.toContain('theme_mode=light');
  });
});

describe('setModeCookie (explicit header toggle only)', () => {
  it('writes the theme_mode cookie and sets data-mode, unlike mere resolution', () => {
    setModeCookie('dark');

    expect(document.cookie).toContain('theme_mode=dark');
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
  });
});

describe('applyMode', () => {
  it('sets data-mode on <html> without touching the cookie', () => {
    applyMode('light');

    expect(document.documentElement.getAttribute('data-mode')).toBe('light');
    expect(document.cookie).not.toContain('theme_mode=dark');
    expect(document.cookie).not.toContain('theme_mode=light');
  });
});
