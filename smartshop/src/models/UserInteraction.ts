// models/UserInteraction.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUserInteraction extends Document {
  userId?: string;
  sessionId?: string;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: Date;
}

const UserInteractionSchema = new Schema<IUserInteraction>({
  userId: {
    type: String,
    index: true,
  },
  sessionId: String,
  eventType: {
    type: String,
    required: true,
    index: true,
  },
  eventData: {
    type: Schema.Types.Mixed,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default mongoose.models.UserInteraction ||
  mongoose.model<IUserInteraction>("UserInteraction", UserInteractionSchema);

