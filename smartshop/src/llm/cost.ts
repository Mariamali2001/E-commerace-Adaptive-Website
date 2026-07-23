/**
 * Cost model for the offline LLM Component Generator.
 *
 * Live website path: $0 — VariantResolver only, no LLM calls.
 * Offline / admin: pay once per missing (component, variant) then cache forever.
 *
 * Default provider for testing: Gemini (free tier friendly).
 * Switch later: LLM_PROVIDER=openai + OPENAI_API_KEY.
 */

export type ModelPricing = {
  /** USD per 1M input tokens */
  inputPer1M: number;
  /** USD per 1M output tokens */
  outputPer1M: number;
};

/** Approximate public list prices — update if you change model. */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
  // Gemini Flash — treat free-tier testing as ~$0; paid rates are still low
  "gemini-2.0-flash": { inputPer1M: 0.1, outputPer1M: 0.4 },
  "gemini-1.5-flash": { inputPer1M: 0.075, outputPer1M: 0.3 },
};

export const DEFAULT_LLM_MODEL = "gemini-2.0-flash";

/** Thesis-scale estimate: finite guideline values → finite variants. */
export const COST_BUDGET_NOTES = {
  livePathUsd: 0,
  strategy: "offline_variant_factory",
  defaultProvider: "gemini",
  typicalVariantCount: "20–40 unique component variants for the full catalog",
  typicalTokensPerVariant: { input: 800, output: 1200 },
  estimatedFullCatalogUsd: 0.05,
} as const;

export function estimateCostUsd(opts: {
  model?: string | null;
  promptTokens: number;
  completionTokens: number;
}): number {
  const raw = opts.model ?? DEFAULT_LLM_MODEL;
  const model = raw.replace(/^(gemini|openai):/, "");
  const pricing =
    MODEL_PRICING[model] ??
    (model.includes("gemini")
      ? MODEL_PRICING["gemini-2.0-flash"]
      : MODEL_PRICING["gpt-4o-mini"]);
  const input = (opts.promptTokens / 1_000_000) * pricing.inputPer1M;
  const output = (opts.completionTokens / 1_000_000) * pricing.outputPer1M;
  return Math.round((input + output) * 1_000_000) / 1_000_000;
}

export function estimateCatalogCostUsd(
  variantCount: number,
  model = DEFAULT_LLM_MODEL
) {
  const { input, output } = COST_BUDGET_NOTES.typicalTokensPerVariant;
  const per = estimateCostUsd({
    model,
    promptTokens: input,
    completionTokens: output,
  });
  return {
    model,
    variantCount,
    estimatedUsd: Math.round(per * variantCount * 1000) / 1000,
    note: "One-time offline cost if every variant is LLM-generated and none are hand-seeded. Cache hits = $0. Gemini free tier often covers thesis testing.",
  };
}
