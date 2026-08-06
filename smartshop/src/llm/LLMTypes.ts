/**
 * LLM layer types.
 * The Adaptive Engine remains the only source of UI decisions.
 * The LLM only implements React/TSX from an ImplementationSpec.
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
  /** SHA-256 (truncated) of sorted decisions — configuration hash */
  hash: string;
  /** Short decision keys → chosen guideline values (or nudge signed strings) */
  decisions: Record<string, string>;
};

export type VariantRequest = {
  componentName: SupportedComponent;
  /** e.g. small_strip, mega_menu, info_rich */
  variantId: string;
  /** Only the decisions relevant to this component — never context */
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
  /** Full Final UI Configuration → ImplementationSpec hash */
  configurationHash: string;
  /** Path under generated_components/, if written */
  filePath: string | null;
  /** Hand-seeded runtime module path, if catalog */
  modulePath: string | null;
};

export type ComponentBundleEntry = {
  componentName: SupportedComponent;
  variantId: string;
  source: GenerationResult["source"];
  cacheHit: boolean;
  filePath: string | null;
  modulePath: string | null;
  model: string | null;
  durationMs: number;
  error?: string;
};

/** Result of ensuring all components for one Final UI Configuration */
export type GeneratedComponentBundle = {
  configurationHash: string;
  decisions: Record<string, string>;
  components: ComponentBundleEntry[];
  allCached: boolean;
  durationMs: number;
};

export type LLMLogEntry = {
  timestamp: string;
  componentName: string;
  variantId: string;
  configurationHash?: string;
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
