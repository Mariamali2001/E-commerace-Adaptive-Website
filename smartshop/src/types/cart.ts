export type CartKey = string; // slug|size|color

export type CartItem = {
  key: CartKey;
  slug: string;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  qty: number;
};

export type WishlistItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
};
