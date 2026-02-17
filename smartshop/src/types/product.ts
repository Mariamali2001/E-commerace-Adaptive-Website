// types/product.ts
export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAt?: number;
  rating: number;
  images: string[];
  colors: string[];
  sizes: string[];
  description: string;
  details?: string;
  category?: string;
  brand?: string;
};
