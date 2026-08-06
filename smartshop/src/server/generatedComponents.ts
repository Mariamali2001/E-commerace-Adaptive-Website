import "server-only";

import connectDB from "@/lib/mongodb";
import GeneratedComponentModel from "@/models/GeneratedComponent";

export async function persistGeneratedComponent(input: {
  configurationHash: string;
  cacheKey: string;
  componentName: string;
  variantId: string;
  generatedCode: string;
  generatedFile?: string;
  model?: string | null;
  generationTimeMs?: number;
  promptTokens?: number | null;
  completionTokens?: number | null;
}) {
  await connectDB();
  await GeneratedComponentModel.findOneAndUpdate(
    { cacheKey: input.cacheKey },
    {
      configurationHash: input.configurationHash,
      cacheKey: input.cacheKey,
      componentName: input.componentName,
      variantId: input.variantId,
      generatedCode: input.generatedCode,
      generatedFile: input.generatedFile ?? null,
      llmModel: input.model ?? null,
      generationTimeMs: input.generationTimeMs ?? null,
      promptTokens: input.promptTokens ?? null,
      completionTokens: input.completionTokens ?? null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function findGeneratedComponent(cacheKey: string): Promise<{
  generatedCode: string;
  model: string | null;
} | null> {
  try {
    await connectDB();
    const doc = await GeneratedComponentModel.findOne({ cacheKey }).lean();
    if (!doc?.generatedCode) return null;
    return {
      generatedCode: doc.generatedCode,
      model: doc.llmModel ?? null,
    };
  } catch {
    return null;
  }
}
