import { api } from './client';
import type { Product } from '../types';

export function getFavorites() {
  return api.get<{ items: Product[] }>('/favorites');
}

export function addFavorite(productId: number) {
  return api.post<{ productId: number }>(`/favorites/${productId}`);
}

export function removeFavorite(productId: number) {
  return api.delete<void>(`/favorites/${productId}`);
}
