// models/Product.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
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
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
    compareAt: Number,
    rating: {
      type: Number,
      default: 0,
    },
    images: [String],
    colors: [String],
    sizes: [String],
    description: {
      type: String,
      required: true,
    },
    details: String,
    category: {
      type: String,
      index: true,
    },
    brand: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

