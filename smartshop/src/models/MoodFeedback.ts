import mongoose, { Schema, Document } from "mongoose";

/**
 * Labeled face frames from mood validation (Yes + No).
 * Collected for offline fine-tuning — not used for live model updates.
 */
export interface IMoodFeedback extends Document {
  userId?: string | null;
  email?: string | null;
  /** Raw FER label from the model (e.g. happy, angry) */
  predictedRaw?: string | null;
  /** Bridged guideline mood shown to the user before confirm */
  predictedGuideline: string;
  /** Mood the participant confirmed / corrected */
  confirmedGuideline: string;
  wasCorrect: boolean;
  confidence?: number | null;
  /** Which detector produced the prediction */
  moodBackend?: "efficientnet" | "vit" | null;
  /** JPEG as base64 (no data: prefix) */
  imageBase64: string;
  mimeType?: string;
  createdAt?: Date;
}

const MoodFeedbackSchema = new Schema<IMoodFeedback>(
  {
    userId: { type: String, default: null, index: true },
    email: { type: String, default: null },
    predictedRaw: { type: String, default: null },
    predictedGuideline: { type: String, required: true, index: true },
    confirmedGuideline: { type: String, required: true, index: true },
    wasCorrect: { type: Boolean, required: true, index: true },
    confidence: { type: Number, default: null },
    moodBackend: { type: String, default: null, index: true },
    imageBase64: { type: String, required: true },
    mimeType: { type: String, default: "image/jpeg" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.MoodFeedback ||
  mongoose.model<IMoodFeedback>("MoodFeedback", MoodFeedbackSchema);
