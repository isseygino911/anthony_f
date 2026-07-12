import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as cartApi from '../api/cart';
import type { Cart } from '../types';

interface CartContextValue {
  cart: Cart;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
}

const EMPTY_CART: Cart = { items: [], subtotal: 0 };

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

  const addItem = useCallback(async (productId: number, quantity = 1) => {
    const data = await cartApi.addCartItem(productId, quantity);
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

  const clear = useCallback(async () => {
    await cartApi.clearCart();
    setCart(EMPTY_CART);
  }, []);

  const value = useMemo(
    () => ({ cart, loading, error, refresh, addItem, updateItem, removeItem, clear }),
    [cart, loading, error, refresh, addItem, updateItem, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
