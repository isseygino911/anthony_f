import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getTheme } from '../api/theme';
import type { ThemeResponse } from '../types';
import { applyTheme } from './applyTheme';
import { applyMode, resolveMode, setModeCookie } from './resolveMode';
import type { ThemeMode } from './resolveMode';

interface ThemeContextValue {
  theme: ThemeResponse | null;
  loading: boolean;
  error: string | null;
  mode: ThemeMode;
  toggleMode: () => void;
  /** Live-preview only: applies draft colors to CSS vars without touching state/server. See ThemeSettings. */
  previewColors: (colors: { primary: string; secondary: string }) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const FALLBACK_MODE: ThemeMode = 'light';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ThemeMode>(FALLBACK_MODE);

  useEffect(() => {
    let cancelled = false;

    getTheme()
      .then((data) => {
        if (cancelled) return;
        setTheme(data);
        applyTheme(data.resolvedColors);
        const resolved = resolveMode(data.default_mode);
        applyMode(resolved);
        setMode(resolved);
      })
      .catch((err) => {
        if (cancelled) return;
        // Graceful fallback: still apply *a* mode so the app isn't unstyled,
        // even if the theme fetch failed (e.g. backend not up yet).
        const resolved = resolveMode('auto');
        applyMode(resolved);
        setMode(resolved);
        setError(err instanceof Error ? err.message : 'Failed to load theme');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMode = useCallback(() => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setModeCookie(next);
    setMode(next);
  }, [mode]);

  const previewColors = useCallback((colors: { primary: string; secondary: string }) => {
    applyTheme(colors);
  }, []);

  const value = useMemo(
    () => ({ theme, loading, error, mode, toggleMode, previewColors }),
    [theme, loading, error, mode, toggleMode, previewColors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
