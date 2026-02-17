import "server-only";

import connectDB from "@/lib/mongodb";
import ReviewModel from "@/models/Review";
import { Review } from "@/types/review";
import { reviews as seedReviewsData } from "@/data/reviews";

export type ReviewInput = Omit<Review, "id" | "date"> & { id?: string; date?: string; userId?: string };

// Seed reviews on first load
let seeded = false;
async function seedReviews() {
  if (seeded) return;
  
  await connectDB();
  
  const count = await ReviewModel.countDocuments();
  if (count === 0) {
    // Only seed if database is empty
    // Don't set _id, let MongoDB generate it automatically
    await ReviewModel.insertMany(
      seedReviewsData.map((r: Review) => ({
        productId: r.productId,
        author: r.author,
        rating: r.rating,
        comment: r.comment,
        createdAt: new Date(r.date),
      }))
    );
    console.log("Seeded initial reviews");
  }
  seeded = true;
}

export async function listReviews(productId: string) {
  await connectDB();
  await seedReviews();
  
  const reviews = await ReviewModel.find({ productId }).sort({ createdAt: -1 });
  
  return reviews.map((r) => ({
    id: r._id.toString(),
    productId: r.productId,
    author: r.author,
    rating: r.rating,
    comment: r.comment,
    date: r.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  }));
}

export async function createReview(input: ReviewInput) {
  await connectDB();
  
  const review = await ReviewModel.create({
    productId: input.productId,
    userId: input.userId,
    author: input.author,
    rating: input.rating,
    comment: input.comment,
  });

  return {
    id: review._id.toString(),
    productId: review.productId,
    author: review.author,
    rating: review.rating,
    comment: review.comment,
    date: review.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

