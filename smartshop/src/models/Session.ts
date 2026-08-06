// models/Session.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  _id: string; // Custom string ID (UUID)
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const SessionSchema = new Schema<ISession>(
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
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    ipAddress: String,
    userAgent: String,
  },
  { _id: false } // Disable auto ObjectId generation
);

// Auto-delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

