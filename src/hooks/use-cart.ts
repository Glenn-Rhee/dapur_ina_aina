"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  getCartServerSnapshot,
  getCartSnapshot,
  setCart,
  subscribeCart,
  type CartItem,
} from "@/lib/cart-store";

const noopSubscribe = () => () => {};

/** true setelah komponen berjalan di browser (menghindari hydration mismatch). */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export type AddToCartInput = Omit<CartItem, "quantity"> & { quantity?: number };

export function useCart() {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const ready = useIsClient();

  const addItem = useCallback((input: AddToCartInput) => {
    const current = getCartSnapshot();
    const qty = input.quantity ?? 1;
    const existing = current.find((i) => i.id === input.id);
    const max = Math.max(0, input.maxStock);

    if (existing) {
      const nextQty = Math.min(existing.quantity + qty, max, 99);
      setCart(
        current.map((i) =>
          i.id === input.id
            ? {
                ...i,
                name: input.name,
                price: input.price,
                image_url: input.image_url,
                maxStock: max,
                quantity: nextQty,
              }
            : i,
        ),
      );
      return nextQty > existing.quantity;
    }

    const nextQty = Math.min(qty, max, 99);
    if (nextQty <= 0) return false;
    setCart([...current, { ...input, maxStock: max, quantity: nextQty }]);
    return true;
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const current = getCartSnapshot();
    setCart(
      current
        .map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, i.maxStock, 99) } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart(getCartSnapshot().filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const replaceAll = useCallback((next: CartItem[]) => setCart(next), []);

  const totals = useMemo(
    () => ({
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      price: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    [items],
  );

  return { items, ready, totals, addItem, setQuantity, removeItem, clear, replaceAll };
}
