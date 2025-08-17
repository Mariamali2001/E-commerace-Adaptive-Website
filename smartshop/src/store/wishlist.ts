// store/wishlist.ts
import { create } from "zustand";

export type WishlistItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
};

type WishlistState = {
  list: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

export const useWishlist = create<WishlistState>((set) => ({
  list: [],
  add: (item) =>
    set((state) => {
      // avoid duplicates
      if (state.list.some((w) => w.slug === item.slug)) return state;
      return { list: [...state.list, item] };
    }),
  remove: (slug) =>
    set((state) => ({
      list: state.list.filter((w) => w.slug !== slug),
    })),
  clear: () => set({ list: [] }),
}));

// Selectors
export const wishSelectors = {
  list: (s: WishlistState) => s.list,
};
