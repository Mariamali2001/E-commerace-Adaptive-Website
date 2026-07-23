import "server-only";

import connectDB from "@/lib/mongodb";
import GeneratedComponentModel from "@/models/GeneratedComponent";

export async function persistGeneratedComponent(input: {
  configurationHash: string;
  cacheKey: string;
  componentName: string;
  variantId: string;
  generatedCode: string;
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
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
