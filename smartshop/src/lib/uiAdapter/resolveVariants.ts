import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import {
  toImplementationSpec,
  toVariantId,
} from "@/llm/toImplementationSpec";
import type { ImplementationSpec } from "@/llm/LLMTypes";

export type VariantSelection = {
  implementationSpec: ImplementationSpec;
  navigation: string;
  heroBanner: string;
  productCard: string;
  buttonStyle: string;
  priceDisplay: string;
  recommendation: string;
  filters: string;
  checkout: string;
  colorTheme: string;
  accentColor: string;
  background: string;
  grid: string;
  urgency: string;
  whitespace: string;
  /** Soft nudges from traits (never categorical) */
  nudges: {
    information_density: number;
    recommendation_strength: number;
    visual_richness: number;
    social_proof: number;
  };
};

function parseNudge(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Runtime Variant Resolver — NO LLM.
 * Maps Final UI Configuration → variant ids for prebuilt components.
 */
export function resolveVariants(
  configuration: FinalUIConfiguration
): VariantSelection {
  const implementationSpec = toImplementationSpec(configuration);
  const d = implementationSpec.decisions;

  return {
    implementationSpec,
    navigation: toVariantId(d.navigation ?? "mega_menu"),
    heroBanner: toVariantId(d.hero_banner ?? "medium_split"),
    productCard: toVariantId(d.product_card ?? "info_rich"),
    buttonStyle: toVariantId(d.button_style ?? "rounded_corners"),
    priceDisplay: toVariantId(d.price_display ?? "with_savings_highlighted"),
    recommendation: toVariantId(d.recommendation ?? "deals"),
    filters: toVariantId(d.filters ?? "sidebar"),
    checkout: toVariantId(d.checkout ?? "one_page"),
    colorTheme: toVariantId(d.color_theme ?? "minimalist_black_white"),
    accentColor: toVariantId(d.accent_color ?? "blue"),
    background: toVariantId(d.background ?? "cream_off_white"),
    grid: toVariantId(d.grid ?? "3_columns"),
    urgency: toVariantId(d.urgency ?? "both"),
    whitespace: toVariantId(d.whitespace ?? "balanced"),
    nudges: {
      information_density: parseNudge(d.information_density),
      recommendation_strength: parseNudge(d.recommendation_strength),
      visual_richness: parseNudge(d.visual_richness),
      social_proof: parseNudge(d.social_proof),
    },
  };
}

/** Tailwind grid classes from guideline grid token */
export function gridClassFromVariant(grid: string): string {
  if (grid.includes("list")) return "grid grid-cols-1 gap-4";
  if (grid.includes("2")) return "grid grid-cols-1 sm:grid-cols-2 gap-6";
  if (grid.includes("4")) {
    return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";
  }
  // 3 columns default
  return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
}
