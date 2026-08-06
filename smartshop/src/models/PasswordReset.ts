// models/PasswordReset.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPasswordReset extends Document {
  _id: string; // Custom string ID (token)
  userId: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    _id: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false } // Disable auto ObjectId generation
);

// Auto-delete expired reset tokens (1 hour after expiration)
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.models.PasswordReset || 
  mongoose.model<IPasswordReset>("PasswordReset", PasswordResetSchema);

