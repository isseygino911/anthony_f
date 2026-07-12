import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as favoritesApi from '../api/favorites';
import { useAuth } from './useAuth';

interface FavoritesContextValue {
  favoriteIds: Set<number>;
  toggle: (productId: number) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    favoritesApi
      .getFavorites()
      .then((res) => setFavoriteIds(new Set(res.items.map((p) => p.id))))
      .catch(() => setFavoriteIds(new Set()));
  }, [user]);

  const toggle = useCallback(
    async (productId: number) => {
      if (!user) return;
      if (favoriteIds.has(productId)) {
        await favoritesApi.removeFavorite(productId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await favoritesApi.addFavorite(productId);
        setFavoriteIds((prev) => new Set(prev).add(productId));
      }
    },
    [favoriteIds, user],
  );

  const value = useMemo(() => ({ favoriteIds, toggle }), [favoriteIds, toggle]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
