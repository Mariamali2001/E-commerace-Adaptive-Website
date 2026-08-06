// types/review.ts
export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  /** Optional customer photos of the product */
  images?: string[];
};
