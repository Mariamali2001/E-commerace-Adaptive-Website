import mongoose, { Schema, Document } from "mongoose";

export interface IGeneratedComponent extends Document {
  configurationHash: string;
  cacheKey: string;
  componentName: string;
  variantId: string;
  generatedCode: string;
  createdAt: Date;
}

const GeneratedComponentSchema = new Schema<IGeneratedComponent>(
  {
    configurationHash: { type: String, required: true, index: true },
    cacheKey: { type: String, required: true, unique: true },
    componentName: { type: String, required: true, index: true },
    variantId: { type: String, required: true },
    generatedCode: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.GeneratedComponent ||
  mongoose.model<IGeneratedComponent>(
    "GeneratedComponent",
    GeneratedComponentSchema
  );
