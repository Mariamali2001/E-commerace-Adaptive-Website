import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { isAdminEmail } from "@/server/admin";
import {
  SUPPORTED_COMPONENTS,
  resolveLlmProvider,
  resolveModel,
} from "@/llm";
import type { SupportedComponent } from "@/llm";
import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import { estimateCatalogCostUsd, COST_BUDGET_NOTES } from "@/llm/cost";
import { llmService } from "@/llm/LLMService";
import { toImplementationSpec } from "@/llm/toImplementationSpec";

/**
 * POST /api/llm/generate-variant
 * Admin helper to generate one component. Prefer /api/llm/ensure-components
 * for the experiment pipeline.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = (await request.json()) as {
      componentName?: string;
      configuration?: FinalUIConfiguration;
      forceLlm?: boolean;
    };

    if (
      !body.componentName ||
      !SUPPORTED_COMPONENTS.includes(body.componentName as SupportedComponent)
    ) {
      return NextResponse.json(
        {
          error: `componentName must be one of: ${SUPPORTED_COMPONENTS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!body.configuration?.tokens) {
      return NextResponse.json(
        { error: "configuration (FinalUIConfiguration) is required" },
        { status: 400 }
      );
    }

    const spec = toImplementationSpec(body.configuration);
    const result = await llmService.generateComponent(
      body.componentName as SupportedComponent,
      body.configuration,
      { forceLlm: body.forceLlm }
    );

    const provider = resolveLlmProvider();
    return NextResponse.json({
      data: result,
      implementationSpec: { hash: spec.hash, decisions: spec.decisions },
      provider,
      model: resolveModel(provider),
      cost: {
        thisCallEstimatedUsd:
          result.source === "llm"
            ? estimateCatalogCostUsd(1, resolveModel(provider)).estimatedUsd
            : 0,
        note: "Identical configuration hash → cache/catalog = $0.",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Cost / provider status for thesis notes */
export async function GET() {
  const provider = resolveLlmProvider();
  return NextResponse.json({
    data: {
      ...COST_BUDGET_NOTES,
      activeProvider: provider,
      activeModel: resolveModel(provider),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
      catalogEstimate: estimateCatalogCostUsd(30, resolveModel(provider)),
      supportedComponents: SUPPORTED_COMPONENTS,
      pipeline:
        "Adaptive Engine → toImplementationSpec → LLM Component Generator (cached) → Adaptive shop",
    },
  });
}
