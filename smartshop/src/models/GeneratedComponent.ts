import mongoose, { Schema, Document } from "mongoose";

/** Generation metadata only — never Adaptive Engine decision logic. */
export interface IGeneratedComponent extends Document {
  configurationHash: string;
  cacheKey: string;
  componentName: string;
  variantId: string;
  generatedCode: string;
  generatedFile?: string | null;
  /** LLM model id — named llmModel to avoid clashing with mongoose Document.model */
  llmModel?: string | null;
  generationTimeMs?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  createdAt: Date;
}

const GeneratedComponentSchema = new Schema<IGeneratedComponent>(
  {
    configurationHash: { type: String, required: true, index: true },
    cacheKey: { type: String, required: true, unique: true },
    componentName: { type: String, required: true, index: true },
    variantId: { type: String, required: true },
    generatedCode: { type: String, required: true },
    generatedFile: { type: String, default: null },
    llmModel: { type: String, default: null },
    generationTimeMs: { type: Number, default: null },
    promptTokens: { type: Number, default: null },
    completionTokens: { type: Number, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.GeneratedComponent ||
  mongoose.model<IGeneratedComponent>(
    "GeneratedComponent",
    GeneratedComponentSchema
  );
