// models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  age?: number;
  gender?: string;
  phone?: string;
  bio?: string;
  createdAt: Date;
  lastLogin?: Date;
  preferences?: Record<string, any>;
  behavioralData?: Record<string, any>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min: 13,
      max: 120,
    },
    gender: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
    },
    bio: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: {},
    },
    behavioralData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Avoid stale schema in Next.js HMR (old model without age/gender)
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>("User", UserSchema);
