import "server-only";

import connectDB from "@/lib/mongodb";
import ReviewModel from "@/models/Review";
import { Review } from "@/types/review";
import { reviews as seedReviewsData } from "@/data/reviews";

export type ReviewInput = Omit<Review, "id" | "date"> & {
  id?: string;
  date?: string;
  userId?: string;
  images?: string[];
};

function mapReview(r: {
  _id: { toString(): string };
  productId: string;
  author: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
}): Review {
  return {
    id: r._id.toString(),
    productId: r.productId,
    author: r.author,
    rating: r.rating,
    comment: r.comment,
    images: r.images ?? [],
    date: r.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

// Seed reviews once per process (survives hot reload via global)
type SeedCache = { done: boolean; promise: Promise<void> | null };
declare global {
  var __smartshopReviewSeed: SeedCache | undefined;
}
const seedCache: SeedCache = global.__smartshopReviewSeed ?? {
  done: false,
  promise: null,
};
if (!global.__smartshopReviewSeed) {
  global.__smartshopReviewSeed = seedCache;
}

async function seedReviews() {
  if (seedCache.done) return;
  if (seedCache.promise) {
    await seedCache.promise;
    return;
  }

  seedCache.promise = (async () => {
    await connectDB();
    const count = await ReviewModel.countDocuments();
    if (count === 0) {
      await ReviewModel.insertMany(
        seedReviewsData.map((r: Review) => ({
          productId: r.productId,
          author: r.author,
          rating: r.rating,
          comment: r.comment,
          images: r.images ?? [],
          createdAt: new Date(r.date),
        }))
      );
      console.log("Seeded initial reviews");
    }
    seedCache.done = true;
  })();

  try {
    await seedCache.promise;
  } catch (e) {
    seedCache.promise = null;
    throw e;
  }
}

export async function listReviews(productId: string) {
  await connectDB();
  await seedReviews();

  const reviews = await ReviewModel.find({ productId })
    .sort({ createdAt: -1 })
    .lean();
  return reviews.map(mapReview);
}

export async function createReview(input: ReviewInput) {
  await connectDB();

  const review = await ReviewModel.create({
    productId: input.productId,
    userId: input.userId,
    author: input.author,
    rating: input.rating,
    comment: input.comment,
    images: input.images ?? [],
  });

  return mapReview(review);
}
