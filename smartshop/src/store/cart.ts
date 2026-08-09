// store/cart.ts
import { create } from "zustand";

export type CartLine = {
  /** unique line key (e.g., product + selected variant) */
  key: string;
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  qty: number;
  /** optional variant info */
  size?: string;
  color?: string;
};

type CartState = {
  list: CartLine[];
  add: (line: Omit<CartLine, "qty" | "key"> & { qty?: number; key?: string }) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set, get) => ({
  list: [],

  add: (line) =>
    set((state) => {
      const qty = Math.max(1, Math.min(99, line.qty ?? 1));
      // build default key (product + variant)
      const key =
        line.key ??
        [line.id, line.size ?? "", line.color ?? ""]
          .filter(Boolean)
          .join("|");

      const idx = state.list.findIndex((l) => l.key === key);
      if (idx >= 0) {
        const next = [...state.list];
        const existing = next[idx];
        next[idx] = { ...existing, qty: Math.min(99, existing.qty + qty) };
        return { list: next };
      }
      const toAdd: CartLine = {
        key,
        id: line.id,
        slug: line.slug,
        title: line.title,
        price: line.price,
        image: line.image,
        size: line.size,
        color: line.color,
        qty,
      };
      return { list: [...state.list, toAdd] };
    }),

  remove: (key) =>
    set((state) => ({ list: state.list.filter((l) => l.key !== key) })),

  setQty: (key, qty) =>
    set((state) => {
      // qty < 1 → remove line (minus at 1 clears the item)
      if (qty < 1) {
        return { list: state.list.filter((l) => l.key !== key) };
      }
      const q = Math.min(99, qty);
      return {
        list: state.list.map((l) => (l.key === key ? { ...l, qty: q } : l)),
      };
    }),

  clear: () => set({ list: [] }),
}));

// Handy selectors to avoid re-renders
export const cartSelectors = {
  list: (s: CartState) => s.list,
  subtotal: (s: CartState) => s.list.reduce((sum, l) => sum + l.price * l.qty, 0),
};
