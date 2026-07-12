import { api } from './client';
import type { Cart } from '../types';

// Cart state lives server-side, keyed to the anon session / login cookie
// (architecture.md §4.5, §9.3 of the plan). No localStorage/IndexedDB here.

export function getCart() {
  return api.get<Cart>('/cart');
}

export function addCartItem(productId: number, quantity: number) {
  return api.post<Cart>('/cart/items', { productId, quantity });
}

export function updateCartItem(productId: number, quantity: number) {
  return api.patch<Cart>(`/cart/items/${productId}`, { quantity });
}

export function removeCartItem(productId: number) {
  return api.delete<Cart>(`/cart/items/${productId}`);
}

export function clearCart() {
  return api.delete<void>('/cart');
}
