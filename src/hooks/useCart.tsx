import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as cartApi from '../api/cart';
import type { AddCartItemSelections } from '../api/cart';
import type { Cart } from '../types';

interface CartContextValue {
  cart: Cart;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (productId: number, quantity?: number, selections?: AddCartItemSelections) => Promise<void>;
  updateItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  // cartId-scoped variants — required for configurable products (same
  // productId can appear as multiple distinct lines). See api/cart.ts.
  updateLine: (cartId: number, quantity: number) => Promise<void>;
  removeLine: (cartId: number) => Promise<void>;
  clear: () => Promise<void>;
}

const EMPTY_CART: Cart = { items: [], subtotal: 0, hasQuoteItems: false };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await cartApi.getCart();
      setCart(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (productId: number, quantity = 1, selections?: AddCartItemSelections) => {
    const data = await cartApi.addCartItem(productId, quantity, selections);
    setCart(data);
  }, []);

  const updateItem = useCallback(async (productId: number, quantity: number) => {
    const data = await cartApi.updateCartItem(productId, quantity);
    setCart(data);
  }, []);

  const removeItem = useCallback(async (productId: number) => {
    const data = await cartApi.removeCartItem(productId);
    setCart(data);
  }, []);

  const updateLine = useCallback(async (cartId: number, quantity: number) => {
    const data = await cartApi.updateCartLine(cartId, quantity);
    setCart(data);
  }, []);

  const removeLine = useCallback(async (cartId: number) => {
    const data = await cartApi.removeCartLine(cartId);
    setCart(data);
  }, []);

  const clear = useCallback(async () => {
    await cartApi.clearCart();
    setCart(EMPTY_CART);
  }, []);

  const value = useMemo(
    () => ({ cart, loading, error, refresh, addItem, updateItem, removeItem, updateLine, removeLine, clear }),
    [cart, loading, error, refresh, addItem, updateItem, removeItem, updateLine, removeLine, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
