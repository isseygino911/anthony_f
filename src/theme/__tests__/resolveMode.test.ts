// Path 4/4: dark/light/auto mode resolution — architecture.md §5.3.
// No user-facing override exists: default_mode ('light'/'dark' used
// directly, 'auto' resolved via prefers-color-scheme ONCE).
import { describe, it, expect, vi } from 'vitest';
import { resolveMode, applyMode } from '../resolveMode';

function mockPrefersDark(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? matches : false,
    media: query,
  })) as unknown as typeof window.matchMedia;
}

describe('resolveMode', () => {
  it('resolves default_mode="light" directly', () => {
    expect(resolveMode('light')).toBe('light');
  });

  it('resolves default_mode="dark" directly', () => {
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
});

describe('applyMode', () => {
  it('sets data-mode on <html>', () => {
    applyMode('light');

    expect(document.documentElement.getAttribute('data-mode')).toBe('light');
  });
});
