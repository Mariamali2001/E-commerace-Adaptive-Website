import { createHash } from "crypto";
import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import type { ImplementationSpec } from "./LLMTypes";

/**
 * Map repository token keys → short implementation keys for the LLM / resolver.
 * Mood, persona, traits, device are intentionally dropped.
 */
const TOKEN_ALIASES: Record<string, string> = {
  desktop_navigation: "navigation",
  mobile_navigation: "navigation",
  hero_banner_size: "hero_banner",
  desktop_product_card: "product_card",
  mobile_product_card: "product_card",
  button_style_pref: "button_style",
  desktop_price_display: "price_display",
  mobile_price_display: "price_display",
  recommendation_type: "recommendation",
  desktop_filter_placement: "filters",
  mobile_filter_placement: "filters",
  social_proof_display: "social_proof_display",
  color_theme_pref: "color_theme",
  accent_color_pref: "accent_color",
  background_pref: "background",
  font_style_pref: "font_style",
  font_size_pref: "font_size",
  whitespace_pref: "whitespace",
  urgency_pref: "urgency",
  checkout_style: "checkout",
  form_field_style: "form_fields",
  product_desc_length: "product_desc",
  desktop_grid_pref: "grid",
  mobile_grid_pref: "grid",
  desktop_search_visibility: "search",
  mobile_search_visibility: "search",
  desktop_category_display: "categories",
  mobile_category_display: "categories",
};

function shortLabel(value: string): string {
  const before = value.split("(")[0]?.trim() ?? value;
  return before || value;
}

function hashDecisions(decisions: Record<string, string>): string {
  const stable = Object.keys(decisions)
    .sort()
    .map((k) => `${k}=${decisions[k]}`)
    .join("|");
  return createHash("sha256").update(stable).digest("hex").slice(0, 24);
}

/**
 * Project Final UI Configuration → ImplementationSpec.
 * LLM and VariantResolver must only see this object (plus component name).
 */
export function toImplementationSpec(
  configuration: FinalUIConfiguration
): ImplementationSpec {
  const decisions: Record<string, string> = {};

  for (const [repoKey, tok] of Object.entries(configuration.tokens)) {
    const alias = TOKEN_ALIASES[repoKey] ?? repoKey;
    // Prefer device-specific keys already chosen by the engine; later keys overwrite
    // only when alias collides — device defaults already merged in engine order.
    decisions[alias] = shortLabel(tok.value);
  }

  for (const [nudgeKey, delta] of Object.entries(configuration.nudges)) {
    const sign = delta > 0 ? `+${delta}` : String(delta);
    decisions[nudgeKey] = sign;
  }

  return {
    hash: hashDecisions(decisions),
    decisions,
  };
}

/** Stable hash for a component + variant + decision slice (cache key). */
export function variantCacheKey(
  componentName: string,
  variantId: string,
  decisions: Record<string, string>
): string {
  const body = hashDecisions(decisions);
  return `${componentName}:${variantId}:${body}`;
}

/** Turn a guideline short label into a filesystem-safe variant id. */
export function toVariantId(label: string): string {
  return shortLabel(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}
