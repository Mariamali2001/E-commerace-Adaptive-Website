import mongoose from "mongoose";

const cartLineSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    productId: { type: String, required: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    qty: { type: Number, required: true, min: 1, max: 99 },
    size: { type: String },
    color: { type: String },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // cartId (cookie or userId)
    userId: { type: String }, // Optional: link to user if logged in
    lines: [cartLineSchema],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-expire carts after 30 days of inactivity
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);

