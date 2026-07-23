import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import { componentCache } from "./ComponentCache";
import { generateVariantWithLLM, costFromResult } from "./ComponentGenerator";
import { llmLogger } from "./LLMLogger";
import {
  toImplementationSpec,
  toVariantId,
  variantCacheKey,
} from "./toImplementationSpec";
import {
  SUPPORTED_COMPONENTS,
  type GenerationResult,
  type SupportedComponent,
} from "./LLMTypes";
import { getCatalogSource } from "./variantCatalog";

/** Which decision key drives each component family */
const COMPONENT_DECISION_KEYS: Record<SupportedComponent, string[]> = {
  Navbar: ["navigation", "search", "button_style"],
  HeroBanner: ["hero_banner", "button_style", "color_theme", "whitespace"],
  CategorySection: ["categories", "visual_richness", "information_density"],
  SearchBar: ["search", "button_style"],
  ProductGrid: ["grid", "information_density", "visual_richness"],
  ProductCard: [
    "product_card",
    "price_display",
    "button_style",
    "information_density",
    "visual_richness",
  ],
  FilterPanel: ["filters", "information_density"],
  RecommendationSection: ["recommendation", "recommendation_strength", "social_proof"],
  ReviewSection: ["social_proof_display", "information_density"],
  Checkout: ["checkout", "form_fields", "button_style", "urgency"],
  Footer: ["color_theme", "whitespace"],
};

function pickDecisions(
  all: Record<string, string>,
  keys: string[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    if (all[k] != null) out[k] = all[k];
  }
  return out;
}

function primaryVariantId(
  componentName: SupportedComponent,
  decisions: Record<string, string>
): string {
  const primaryKey = COMPONENT_DECISION_KEYS[componentName][0];
  const label = decisions[primaryKey];
  if (!label) return "default";
  return toVariantId(label);
}

/**
 * Offline / admin LLM service.
 * Live website MUST use VariantResolver + prebuilt catalog — not this service.
 */
export class LLMService {
  /**
   * Generate (or reuse) one component variant for a Final UI Configuration.
   * Order: hand catalog → disk cache → optional Mongo → LLM.
   */
  async generateComponent(
    componentName: SupportedComponent,
    finalUIConfiguration: FinalUIConfiguration,
    opts?: { forceLlm?: boolean; persistMongo?: boolean }
  ): Promise<GenerationResult> {
    if (!SUPPORTED_COMPONENTS.includes(componentName)) {
      throw new Error(`Unsupported component: ${componentName}`);
    }

    const spec = toImplementationSpec(finalUIConfiguration);
    const decisions = pickDecisions(
      spec.decisions,
      COMPONENT_DECISION_KEYS[componentName]
    );
    const variantId = primaryVariantId(componentName, {
      ...spec.decisions,
      ...decisions,
    });
    const cacheKey = variantCacheKey(componentName, variantId, decisions);
    const started = Date.now();

    // 1) Hand-seeded catalog (preferred — $0)
    if (!opts?.forceLlm) {
      const catalog = getCatalogSource(componentName, variantId);
      if (catalog) {
        const result: GenerationResult = {
          componentName,
          variantId,
          code: catalog,
          cacheHit: true,
          model: null,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          durationMs: Date.now() - started,
          source: "catalog",
        };
        llmLogger.log({
          timestamp: new Date().toISOString(),
          componentName,
          variantId,
          cacheHit: true,
          source: "catalog",
          model: null,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          durationMs: result.durationMs,
          estimatedCostUsd: 0,
        });
        return result;
      }
    }

    // 2) Local cache
    if (!opts?.forceLlm) {
      const cached = componentCache.get(cacheKey);
      if (cached) {
        const result: GenerationResult = {
          componentName,
          variantId,
          code: cached.code,
          cacheHit: true,
          model: null,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          durationMs: Date.now() - started,
          source: "cache",
        };
        llmLogger.log({
          timestamp: new Date().toISOString(),
          componentName,
          variantId,
          cacheHit: true,
          source: "cache",
          model: null,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          durationMs: result.durationMs,
          estimatedCostUsd: 0,
        });
        return result;
      }
    }

    // 3) LLM (offline only)
    try {
      const generated = await generateVariantWithLLM({
        componentName,
        variantId,
        decisions,
      });
      componentCache.set({
        key: cacheKey,
        componentName,
        variantId,
        code: generated.code,
      });

      if (opts?.persistMongo !== false) {
        void persistGeneratedComponentAsync({
          configurationHash: spec.hash,
          cacheKey,
          componentName,
          variantId,
          generatedCode: generated.code,
        });
      }

      const estimatedCostUsd = costFromResult(generated);
      const result: GenerationResult = {
        ...generated,
        cacheHit: false,
        source: "llm",
      };
      llmLogger.log({
        timestamp: new Date().toISOString(),
        componentName,
        variantId,
        cacheHit: false,
        source: "llm",
        model: generated.model,
        promptTokens: generated.promptTokens,
        completionTokens: generated.completionTokens,
        totalTokens: generated.totalTokens,
        durationMs: generated.durationMs,
        estimatedCostUsd,
      });
      return result;
    } catch (err) {
      llmLogger.log({
        timestamp: new Date().toISOString(),
        componentName,
        variantId,
        cacheHit: false,
        source: "llm",
        model: null,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        durationMs: Date.now() - started,
        estimatedCostUsd: null,
        error: err instanceof Error ? err.message : "generation failed",
      });
      throw err;
    }
  }
}

async function persistGeneratedComponentAsync(doc: {
  configurationHash: string;
  cacheKey: string;
  componentName: string;
  variantId: string;
  generatedCode: string;
}) {
  try {
    const { persistGeneratedComponent } = await import(
      "@/server/generatedComponents"
    );
    await persistGeneratedComponent(doc);
  } catch (err) {
    console.warn("[generated_components] persist skipped:", err);
  }
}

export const llmService = new LLMService();

export async function generateComponent(
  componentName: SupportedComponent,
  finalUIConfiguration: FinalUIConfiguration
): Promise<GenerationResult> {
  return llmService.generateComponent(componentName, finalUIConfiguration);
}
