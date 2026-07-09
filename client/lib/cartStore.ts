/**
 * cartStore.ts
 * Zustand store for the retailer's in-progress order (cart).
 *
 * Design rules (mirror the backend security model):
 *  - Store ONLY { productId, quantity } — never price or product name.
 *  - Prices are always resolved live from fetchProducts() at display time
 *    so stale cached prices can never be shown or sent to the server.
 *  - Persisted to localStorage under `voiceb2b_cart` (separate namespace
 *    from `retailer_token`).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  /** Add 1 unit of a product. Increments if already in cart. */
  addItem: (productId: string) => void;
  /** Remove a product entirely from the cart. */
  removeItem: (productId: string) => void;
  /**
   * Set the exact quantity for a product.
   * Automatically removes the item if qty <= 0.
   */
  updateQuantity: (productId: string, qty: number) => void;
  /** Empty the cart (called after a successful order). */
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (productId) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { productId, quantity: 1 }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'voiceb2b_cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
