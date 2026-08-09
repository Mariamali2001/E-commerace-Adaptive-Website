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
  /** Form chrome: outlined / filled / minimal / underlined / rounded / material */
  formFields: string;
  fontStyle: string;
  fontSize: string;
  search: string;
  productDesc: string;
  imageText: string;
  infoDensity: string;
  touchSize: string;
  stickyHeader: string;
  /** Product preview behavior (modal / sidebar / slide-up / new tab / none / direct) */
  quickView: string;
  /** Home/shop category presentation */
  categories: string;
  /** Yes = permanent sidebar; No = prefer overlay/other placement */
  persistentFilters: string;
  /** PDP review layout (recent / paginated / summary / ratings bar / collapsible) */
  reviewDisplay: string;
  /** Type of social proof (badges / photos / ratings only / customer reviews) */
  socialProofDisplay: string;
  /** How strongly social proof should influence the UI (high / moderate / low / none) */
  socialProofInfluence: string;
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
 * Runtime Variant Resolver — NO LLM decisions.
 * Maps Final UI Configuration → ImplementationSpec → variant ids
 * for catalog / generated React modules.
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
    formFields: toVariantId(d.form_fields ?? "rounded_border_fields"),
    fontStyle: toVariantId(d.font_style ?? "modern_sans_serif"),
    fontSize: toVariantId(d.font_size ?? "medium"),
    search: toVariantId(d.search ?? "always_visible_top"),
    productDesc: toVariantId(d.product_desc ?? "moderate"),
    imageText: toVariantId(d.image_text ?? "balanced"),
    infoDensity: toVariantId(
      d.information_density_label ?? "moderate"
    ),
    touchSize: toVariantId(d.touch_size ?? "standard"),
    stickyHeader: toVariantId(d.sticky_header ?? "yes"),
    quickView: toVariantId(d.quick_view ?? "no_quick_view"),
    categories: toVariantId(d.categories ?? "visual_grid"),
    persistentFilters: toVariantId(d.persistent_filters ?? "yes"),
    reviewDisplay: toVariantId(d.review_display ?? "summary_only"),
    socialProofDisplay: toVariantId(
      d.social_proof_display ?? "customer_reviews"
    ),
    socialProofInfluence: toVariantId(
      d.social_proof_influence ?? "moderate_influence"
    ),
    nudges: {
      // Prefer numeric nudges from Final UI Config (trait soft layer)
      information_density:
        configuration.nudges?.information_density ??
        parseNudge(d.information_density),
      recommendation_strength:
        configuration.nudges?.recommendation_strength ??
        parseNudge(d.recommendation_strength),
      visual_richness:
        configuration.nudges?.visual_richness ??
        parseNudge(d.visual_richness),
      social_proof:
        configuration.nudges?.social_proof ?? parseNudge(d.social_proof),
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
