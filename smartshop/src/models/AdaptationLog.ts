import mongoose, { Schema, Document } from "mongoose";

/**
 * Optional Adaptation Log (thesis / analytics).
 * Written non-blocking — never gates UI generation.
 */
export interface IAdaptationLog extends Document {
  participantId?: string | null;
  userId?: string | null;
  device?: string | null;
  persona?: string | null;
  mood?: string | null;
  detectedMood?: string | null;
  pipeline: string[];
  log: unknown[];
  tokensSnapshot?: Record<string, string>;
  nudges?: Record<string, number>;
  createdAt: Date;
}

const AdaptationLogSchema = new Schema<IAdaptationLog>(
  {
    participantId: { type: String, default: null, index: true },
    userId: { type: String, default: null, index: true },
    device: { type: String, default: null },
    persona: { type: String, default: null },
    mood: { type: String, default: null },
    detectedMood: { type: String, default: null },
    pipeline: { type: [String], default: [] },
    log: { type: [Schema.Types.Mixed], default: [] },
    tokensSnapshot: { type: Schema.Types.Mixed, default: {} },
    nudges: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.AdaptationLog ||
  mongoose.model<IAdaptationLog>("AdaptationLog", AdaptationLogSchema);
