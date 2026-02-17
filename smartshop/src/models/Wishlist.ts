import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // userKey (cookie or userId)
    userId: { type: String }, // Optional: link to user if logged in
    productIds: [{ type: String }],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-expire wishlists after 90 days of inactivity
wishlistSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);

