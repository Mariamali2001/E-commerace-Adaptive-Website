// store/wishlist.ts
import { create } from "zustand";

export type WishlistItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  rating?: number;
};

type WishlistState = {
  list: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (id: string) => void;
  toggle: (item: WishlistItem) => void;
  clear: () => void;
};

export const useWishlist = create<WishlistState>((set) => ({
  list: [],
  add: (item) =>
    set((state) => {
      // avoid duplicates
      if (state.list.some((w) => w.id === item.id)) return state;
      return { list: [...state.list, item] };
    }),
  remove: (id) =>
    set((state) => ({
      list: state.list.filter((w) => w.id !== id),
    })),
  toggle: (item) =>
    set((state) => {
      const exists = state.list.some((w) => w.id === item.id);
      if (exists) {
        return { list: state.list.filter((w) => w.id !== item.id) };
      } else {
        return { list: [...state.list, item] };
      }
    }),
  clear: () => set({ list: [] }),
}));

// Selectors
export const wishlistSelectors = {
  list: (s: WishlistState) => s.list,
};

// Keep old export for backward compatibility
export const wishSelectors = wishlistSelectors;
