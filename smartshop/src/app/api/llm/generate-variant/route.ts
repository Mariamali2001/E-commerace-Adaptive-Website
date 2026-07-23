import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { isAdminEmail } from "@/server/admin";
import {
  generateComponent,
  SUPPORTED_COMPONENTS,
  resolveLlmProvider,
  resolveModel,
} from "@/llm";
import type { SupportedComponent } from "@/llm";
import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import { estimateCatalogCostUsd, COST_BUDGET_NOTES } from "@/llm/cost";
import { llmService } from "@/llm/LLMService";

/**
 * POST /api/llm/generate-variant
 * OFFLINE / admin only — never called from live page render.
 * Default provider: Gemini (set LLM_PROVIDER=openai later to switch).
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

    const result = await llmService.generateComponent(
      body.componentName as SupportedComponent,
      body.configuration,
      { forceLlm: body.forceLlm }
    );

    const provider = resolveLlmProvider();
    return NextResponse.json({
      data: result,
      provider,
      model: resolveModel(provider),
      cost: {
        livePathUsd: COST_BUDGET_NOTES.livePathUsd,
        thisCallEstimatedUsd:
          result.source === "llm"
            ? estimateCatalogCostUsd(1, resolveModel(provider)).estimatedUsd
            : 0,
        note: "Live shop never hits this endpoint. Cache/catalog = $0.",
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
      switchBackToOpenAI:
        "Set LLM_PROVIDER=openai and OPENAI_API_KEY in .env.local, restart dev server.",
    },
  });
}
