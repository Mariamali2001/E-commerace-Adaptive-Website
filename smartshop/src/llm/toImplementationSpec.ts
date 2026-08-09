import { createHash } from "crypto";
import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import type { ImplementationSpec } from "./LLMTypes";

/**
 * Context keys that MUST never reach the LLM.
 * The Adaptive Engine has already consumed these.
 */
const FORBIDDEN_DECISION_KEYS = new Set([
  "persona",
  "mood",
  "detectedMood",
  "detected_mood",
  "traits",
  "device",
  "surveyPersona",
  "survey_persona",
  "participantId",
  "userId",
  "age",
  "gender",
  "contextRef",
  "pipeline",
  "log",
  "moodFallback",
  "factorFallbacks",
  "globalFill",
  "engine",
  "source",
  "version",
]);

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
  desktop_filter_location: "filters",
  mobile_filter_location: "filters",
  desktop_review_display: "review_display",
  mobile_review_display: "review_display",
  desktop_info_density: "information_density_label",
  mobile_info_density: "information_density_label",
  social_proof_display: "social_proof_display",
  color_theme_pref: "color_theme",
  accent_color_pref: "accent_color",
  background_pref: "background",
  font_style_pref: "font_style",
  font_size_pref: "font_size",
  whitespace_pref: "whitespace",
  desktop_whitespace: "whitespace",
  mobile_whitespace: "whitespace",
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
  desktop_image_text_ratio: "image_text",
  mobile_image_text_ratio: "image_text",
  mobile_touch_size: "touch_size",
  mobile_sticky_header: "sticky_header",
  desktop_persistent_filters: "persistent_filters",
  desktop_quick_view: "quick_view",
  mobile_quick_view: "quick_view",
  social_proof_influence: "social_proof_influence",
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

function assertNoContextLeak(decisions: Record<string, string>) {
  for (const key of Object.keys(decisions)) {
    if (FORBIDDEN_DECISION_KEYS.has(key)) {
      throw new Error(
        `toImplementationSpec leaked context key "${key}" — LLM must never receive this`
      );
    }
  }
}

/**
 * MANDATORY projection: Final UI Configuration → ImplementationSpec.
 *
 * Strips persona, mood, device, traits, logs, and all context.
 * LLM / ComponentGenerator must receive ONLY the returned `decisions`.
 *
 * Decision values keep the FULL survey option text, including the
 * parenthetical description — e.g. "Filled Background (Shaded background,
 * no border)" — so implementation matches what participants saw.
 * Variant ids still use shortLabel via toVariantId().
 */
export function toImplementationSpec(
  configuration: FinalUIConfiguration
): ImplementationSpec {
  const decisions: Record<string, string> = {};

  for (const [repoKey, tok] of Object.entries(configuration.tokens ?? {})) {
    if (FORBIDDEN_DECISION_KEYS.has(repoKey)) continue;
    const alias = TOKEN_ALIASES[repoKey] ?? repoKey;
    if (FORBIDDEN_DECISION_KEYS.has(alias)) continue;
    // Keep survey wording + description (do not strip parentheses here)
    decisions[alias] = String(tok.value).trim();
  }

  for (const [nudgeKey, delta] of Object.entries(configuration.nudges ?? {})) {
    if (FORBIDDEN_DECISION_KEYS.has(nudgeKey)) continue;
    const sign = delta > 0 ? `+${delta}` : String(delta);
    decisions[nudgeKey] = sign;
  }

  assertNoContextLeak(decisions);

  return {
    hash: hashDecisions(decisions),
    decisions,
  };
}

/** Stable hash for a component + variant + decision slice (secondary cache key). */
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

export { FORBIDDEN_DECISION_KEYS, hashDecisions };
