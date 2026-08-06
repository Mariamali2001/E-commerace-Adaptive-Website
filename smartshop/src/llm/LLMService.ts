import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import { componentCache } from "./ComponentCache";
import { componentStorage } from "./ComponentStorage";
import { generateVariantWithLLM, costFromResult } from "./ComponentGenerator";
import { llmLogger } from "./LLMLogger";
import {
  toImplementationSpec,
  toVariantId,
  variantCacheKey,
} from "./toImplementationSpec";
import {
  SUPPORTED_COMPONENTS,
  type ComponentBundleEntry,
  type GeneratedComponentBundle,
  type GenerationResult,
  type SupportedComponent,
} from "./LLMTypes";
import { getCatalogModulePath, getCatalogSource } from "./variantCatalog";

/** Which decision keys are sent to the LLM for each component (no context). */
export const COMPONENT_DECISION_KEYS: Record<SupportedComponent, string[]> = {
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
  RecommendationSection: [
    "recommendation",
    "recommendation_strength",
    "social_proof",
  ],
  // social_proof_display = type of proof; review_display = PDP review layout
  ReviewSection: [
    "social_proof_display",
    "review_display",
    "information_density",
  ],
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

function toBundleEntry(result: GenerationResult): ComponentBundleEntry {
  return {
    componentName: result.componentName,
    variantId: result.variantId,
    source: result.source,
    cacheHit: result.cacheHit,
    filePath: result.filePath,
    modulePath: result.modulePath,
    model: result.model,
    durationMs: result.durationMs,
  };
}

/**
 * LLM Component Generator service.
 *
 * Adaptive Engine decides UI. This service ONLY implements React/TSX
 * from toImplementationSpec(decisions). Unseen configs → LLM; identical
 * configuration hash → reuse generated_components / cache.
 */
export class LLMService {
  /**
   * Generate (or reuse) one component for a Final UI Configuration.
   * Order: generated_components → disk cache → catalog → Mongo → LLM.
   */
  async generateComponent(
    componentName: SupportedComponent,
    finalUIConfiguration: FinalUIConfiguration,
    opts?: { forceLlm?: boolean; persistMongo?: boolean }
  ): Promise<GenerationResult> {
    if (!SUPPORTED_COMPONENTS.includes(componentName)) {
      throw new Error(`Unsupported component: ${componentName}`);
    }

    // 1) Mandatory strip — LLM never sees persona/mood/device/traits
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

    const finish = (
      partial: Omit<
        GenerationResult,
        "configurationHash" | "durationMs"
      > & { durationMs?: number }
    ): GenerationResult => ({
      ...partial,
      configurationHash: spec.hash,
      durationMs: partial.durationMs ?? Date.now() - started,
    });

    // 2) generated_components/ by configuration hash
    if (!opts?.forceLlm) {
      const stored = componentStorage.get(componentName, spec.hash);
      if (stored?.code) {
        const result = finish({
          componentName,
          variantId: stored.variantId || variantId,
          code: stored.code,
          cacheHit: true,
          model: stored.model,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          source: stored.source === "llm" ? "cache" : stored.source,
          filePath: stored.relativePath,
          modulePath: stored.modulePath ?? null,
        });
        llmLogger.log({
          timestamp: new Date().toISOString(),
          componentName,
          variantId: result.variantId,
          configurationHash: spec.hash,
          cacheHit: true,
          source: result.source,
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

    // 3) .llm-cache secondary store
    if (!opts?.forceLlm) {
      const cached = componentCache.get(cacheKey);
      if (cached?.code) {
        const saved = componentStorage.save({
          configurationHash: spec.hash,
          componentName,
          variantId,
          code: cached.code,
          source: "cache",
          model: null,
        });
        const result = finish({
          componentName,
          variantId,
          code: cached.code,
          cacheHit: true,
          model: null,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          source: "cache",
          filePath: saved.relativePath,
          modulePath: null,
        });
        llmLogger.log({
          timestamp: new Date().toISOString(),
          componentName,
          variantId,
          configurationHash: spec.hash,
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

    // 4) Hand-seeded catalog (reuse existing project components — $0)
    if (!opts?.forceLlm) {
      const modulePath = getCatalogModulePath(componentName, variantId);
      const catalog = getCatalogSource(componentName, variantId);
      if (catalog && modulePath) {
        const saved = componentStorage.save({
          configurationHash: spec.hash,
          componentName,
          variantId,
          code: catalog,
          source: "catalog",
          model: null,
          modulePath,
        });
        const result = finish({
          componentName,
          variantId,
          code: catalog,
          cacheHit: true,
          model: null,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          source: "catalog",
          filePath: saved.relativePath,
          modulePath,
        });
        llmLogger.log({
          timestamp: new Date().toISOString(),
          componentName,
          variantId,
          configurationHash: spec.hash,
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

    // 5) Optional Mongo read
    if (!opts?.forceLlm) {
      try {
        const { findGeneratedComponent } = await import(
          "@/server/generatedComponents"
        );
        const mongoDoc = await findGeneratedComponent(cacheKey);
        if (mongoDoc?.generatedCode) {
          const saved = componentStorage.save({
            configurationHash: spec.hash,
            componentName,
            variantId,
            code: mongoDoc.generatedCode,
            source: "mongo",
            model: mongoDoc.model ?? null,
            modulePath: null,
          });
          componentCache.set({
            key: cacheKey,
            componentName,
            variantId,
            code: mongoDoc.generatedCode,
          });
          const result = finish({
            componentName,
            variantId,
            code: mongoDoc.generatedCode,
            cacheHit: true,
            model: mongoDoc.model ?? null,
            promptTokens: null,
            completionTokens: null,
            totalTokens: null,
            source: "mongo",
            filePath: saved.relativePath,
            modulePath: null,
          });
          llmLogger.log({
            timestamp: new Date().toISOString(),
            componentName,
            variantId,
            configurationHash: spec.hash,
            cacheHit: true,
            source: "mongo",
            model: result.model,
            promptTokens: null,
            completionTokens: null,
            totalTokens: null,
            durationMs: result.durationMs,
            estimatedCostUsd: 0,
          });
          return result;
        }
      } catch {
        /* Mongo optional */
      }
    }

    // 6) LLM — unseen configuration only
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

      const saved = componentStorage.save({
        configurationHash: spec.hash,
        componentName,
        variantId,
        code: generated.code,
        source: "llm",
        model: generated.model,
      });

      if (opts?.persistMongo !== false) {
        void persistGeneratedComponentAsync({
          configurationHash: spec.hash,
          cacheKey,
          componentName,
          variantId,
          generatedCode: generated.code,
          generatedFile: saved.relativePath,
          model: generated.model,
          generationTimeMs: generated.durationMs,
          promptTokens: generated.promptTokens,
          completionTokens: generated.completionTokens,
        });
      }

      const estimatedCostUsd = costFromResult(generated);
      const result = finish({
        ...generated,
        cacheHit: false,
        source: "llm",
        filePath: saved.relativePath,
        modulePath: null,
      });
      llmLogger.log({
        timestamp: new Date().toISOString(),
        componentName,
        variantId,
        configurationHash: spec.hash,
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
        configurationHash: spec.hash,
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

  /**
   * Ensure React components exist for this Final UI Configuration.
   * Cache hits skip the LLM. Identical configuration hash → reuse.
   */
  async ensureComponents(
    finalUIConfiguration: FinalUIConfiguration,
    opts?: {
      components?: SupportedComponent[];
      forceLlm?: boolean;
      persistMongo?: boolean;
    }
  ): Promise<GeneratedComponentBundle> {
    const started = Date.now();
    const spec = toImplementationSpec(finalUIConfiguration);
    const names = opts?.components ?? [...SUPPORTED_COMPONENTS];
    const components: ComponentBundleEntry[] = [];

    for (const name of names) {
      try {
        const result = await this.generateComponent(
          name,
          finalUIConfiguration,
          {
            forceLlm: opts?.forceLlm,
            persistMongo: opts?.persistMongo,
          }
        );
        components.push(toBundleEntry(result));
      } catch (err) {
        const decisions = pickDecisions(
          spec.decisions,
          COMPONENT_DECISION_KEYS[name]
        );
        const variantId = primaryVariantId(name, {
          ...spec.decisions,
          ...decisions,
        });
        const modulePath = getCatalogModulePath(name, variantId);
        if (modulePath) {
          const catalog = getCatalogSource(name, variantId)!;
          const saved = componentStorage.save({
            configurationHash: spec.hash,
            componentName: name,
            variantId,
            code: catalog,
            source: "catalog",
            model: null,
            modulePath,
          });
          components.push({
            componentName: name,
            variantId,
            source: "catalog",
            cacheHit: true,
            filePath: saved.relativePath,
            modulePath,
            model: null,
            durationMs: 0,
            error:
              err instanceof Error
                ? `LLM unavailable; catalog used: ${err.message}`
                : "LLM unavailable; catalog used",
          });
        } else {
          components.push({
            componentName: name,
            variantId,
            source: "llm",
            cacheHit: false,
            filePath: null,
            modulePath: null,
            model: null,
            durationMs: 0,
            error: err instanceof Error ? err.message : "generation failed",
          });
        }
      }
    }

    return {
      configurationHash: spec.hash,
      decisions: spec.decisions,
      components,
      allCached: components.every((c) => c.cacheHit && !c.error),
      durationMs: Date.now() - started,
    };
  }
}

async function persistGeneratedComponentAsync(doc: {
  configurationHash: string;
  cacheKey: string;
  componentName: string;
  variantId: string;
  generatedCode: string;
  generatedFile: string;
  model: string | null;
  generationTimeMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
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

export async function ensureComponents(
  finalUIConfiguration: FinalUIConfiguration,
  opts?: {
    components?: SupportedComponent[];
    forceLlm?: boolean;
    persistMongo?: boolean;
  }
): Promise<GeneratedComponentBundle> {
  return llmService.ensureComponents(finalUIConfiguration, opts);
}
