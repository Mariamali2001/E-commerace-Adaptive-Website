/**
 * LLM layer types.
 * The Adaptive Engine remains the only source of UI decisions.
 * The LLM only implements variants from a Final UI Configuration projection.
 */

export const SUPPORTED_COMPONENTS = [
  "Navbar",
  "HeroBanner",
  "CategorySection",
  "SearchBar",
  "ProductGrid",
  "ProductCard",
  "FilterPanel",
  "RecommendationSection",
  "ReviewSection",
  "Checkout",
  "Footer",
] as const;

export type SupportedComponent = (typeof SUPPORTED_COMPONENTS)[number];

/**
 * Flat implementation-only view of FinalUIConfiguration.
 * MUST NOT include mood, persona, traits, device, survey, or raw repos.
 */
export type ImplementationSpec = {
  /** Deterministic hash of this object (cache key material) */
  hash: string;
  /** Short decision keys → chosen guideline values (or nudge signed strings) */
  decisions: Record<string, string>;
};

export type VariantRequest = {
  componentName: SupportedComponent;
  /** e.g. small_strip, mega_menu, info_rich */
  variantId: string;
  /** Only the decisions relevant to this component */
  decisions: Record<string, string>;
};

export type GenerationResult = {
  componentName: SupportedComponent;
  variantId: string;
  code: string;
  cacheHit: boolean;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  durationMs: number;
  source: "catalog" | "cache" | "llm" | "mongo";
};

export type LLMLogEntry = {
  timestamp: string;
  componentName: string;
  variantId: string;
  cacheHit: boolean;
  source: GenerationResult["source"];
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  durationMs: number;
  estimatedCostUsd: number | null;
  error?: string;
};

export type ValidationResult =
  | { ok: true; code: string }
  | { ok: false; errors: string[] };
