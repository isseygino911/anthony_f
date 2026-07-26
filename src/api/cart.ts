import { api } from './client';
import type { Cart } from '../types';

// Cart state lives server-side, keyed to the anon session / login cookie
// (architecture.md §4.5, §9.3 of the plan). No localStorage/IndexedDB here.

export interface AddCartItemSelections {
  sizeInches?: number;
  selectedOptions?: Record<string, string>;
}

export function getCart() {
  return api.get<Cart>('/cart');
}

// selections is only required for configurable products (product.pricing_config
// is set) — the server rejects the add if it's missing for one. Price is
// always computed server-side (pricing.service.js), never here.
export function addCartItem(productId: number, quantity: number, selections?: AddCartItemSelections) {
  return api.post<Cart>('/cart/items', { productId, quantity, ...selections });
}

export function updateCartItem(productId: number, quantity: number) {
  return api.patch<Cart>(`/cart/items/${productId}`, { quantity });
}

export function removeCartItem(productId: number) {
  return api.delete<Cart>(`/cart/items/${productId}`);
}

// cartId-scoped variants — required for configurable products, where the
// same product can appear as multiple distinct lines (different
// size/options), so a productId-only lookup is ambiguous. Safe for plain
// products too since cartId is always unique per line.
export function updateCartLine(cartId: number, quantity: number) {
  return api.patch<Cart>(`/cart/lines/${cartId}`, { quantity });
}

export function removeCartLine(cartId: number) {
  return api.delete<Cart>(`/cart/lines/${cartId}`);
}

export function clearCart() {
  return api.delete<void>('/cart');
}
