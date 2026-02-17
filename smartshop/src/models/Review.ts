// models/Review.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  productId: string;
  userId?: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    author: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      minlength: 3,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

