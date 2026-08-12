import mongoose, { Schema, Document } from "mongoose";

/**
 * One experiment run per user (upserted when mood + guidelines complete).
 * Used for admin Excel export.
 */
export interface IExperimentResult extends Document {
  userId: string;
  email: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  device?: string | null;
  surveyPersona?: string | null;
  guidelinePersona?: string | null;
  /** TIPI continuous scores on 1–5 scale */
  traitScores?: {
    Extraversion?: number;
    Agreeableness?: number;
    Conscientiousness?: number;
    Neuroticism?: number;
    Openness?: number;
  };
  traitLevels?: Record<string, string>;
  /** Raw questionnaire answers (includes tipi_* 1–5 items) */
  answers?: Record<string, string>;
  selfReportedMood?: string | null;
  /** Raw FER label from the face model when camera was used */
  detectedMood?: string | null;
  detectedConfidence?: number | null;
  /** Bridged guideline mood predicted before user confirmation */
  predictedGuidelineMood?: string | null;
  /** Mood the participant confirmed / chose (drives adaptation intent) */
  confirmedMood?: string | null;
  /** true/false after camera validation; null for manual backup */
  moodWasCorrect?: boolean | null;
  moodSource?: "camera" | "manual" | null;
  /** efficientnet (Railway) | vit (Modal) */
  moodBackend?: "efficientnet" | "vit" | null;
  /** Mood used in the adaptive engine output cell */
  guidelineMood?: string | null;
  /** Snapshot of resolved UI tokens (key → value); filled more after adaptation */
  uiElements?: Record<string, string>;
  guidelinesPipeline?: string[];
  completedAt?: Date;
}

const ExperimentResultSchema = new Schema<IExperimentResult>(
  {
    userId: { type: String, required: true, index: true, unique: true },
    email: { type: String, required: true, index: true },
    name: { type: String, required: true },
    age: { type: Number, default: null },
    gender: { type: String, default: null },
    device: { type: String, default: null },
    surveyPersona: { type: String, default: null },
    guidelinePersona: { type: String, default: null },
    traitScores: { type: Schema.Types.Mixed, default: {} },
    traitLevels: { type: Schema.Types.Mixed, default: {} },
    answers: { type: Schema.Types.Mixed, default: {} },
    selfReportedMood: { type: String, default: null },
    detectedMood: { type: String, default: null },
    detectedConfidence: { type: Number, default: null },
    predictedGuidelineMood: { type: String, default: null },
    confirmedMood: { type: String, default: null },
    moodWasCorrect: { type: Boolean, default: null },
    moodSource: { type: String, default: null },
    moodBackend: { type: String, default: null },
    guidelineMood: { type: String, default: null },
    uiElements: { type: Schema.Types.Mixed, default: {} },
    guidelinesPipeline: { type: [String], default: [] },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.ExperimentResult ||
  mongoose.model<IExperimentResult>("ExperimentResult", ExperimentResultSchema);
