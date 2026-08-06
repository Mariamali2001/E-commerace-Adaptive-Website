import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { llmService } from "@/llm/LLMService";
import {
  SUPPORTED_COMPONENTS,
  type SupportedComponent,
} from "@/llm/LLMTypes";
import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import { toImplementationSpec } from "@/llm/toImplementationSpec";
import { resolveLlmProvider, resolveModel } from "@/llm/provider";

/**
 * POST /api/llm/ensure-components
 *
 * Pipeline step after Adaptive Engine:
 *   FinalUIConfiguration → toImplementationSpec → generate/cache React components
 *
 * Identical configuration hash → cache reuse (no LLM).
 */
export async function POST(request: Request) {
  try {
    await requireUser();

    const body = (await request.json()) as {
      configuration?: FinalUIConfiguration;
      components?: SupportedComponent[];
      forceLlm?: boolean;
    };

    if (!body.configuration?.tokens) {
      return NextResponse.json(
        { error: "configuration (FinalUIConfiguration with tokens) is required" },
        { status: 400 }
      );
    }

    const components =
      body.components?.filter((c) =>
        SUPPORTED_COMPONENTS.includes(c as SupportedComponent)
      ) ?? undefined;

    // Spec is computed inside the service; expose it for thesis transparency
    const spec = toImplementationSpec(body.configuration);

    const bundle = await llmService.ensureComponents(body.configuration, {
      components: components as SupportedComponent[] | undefined,
      forceLlm: body.forceLlm,
    });

    const provider = resolveLlmProvider();
    const failed = bundle.components.filter((c) => c.error && !c.modulePath);

    return NextResponse.json({
      data: bundle,
      implementationSpec: {
        hash: spec.hash,
        decisions: spec.decisions,
      },
      provider,
      model: resolveModel(provider),
      note:
        "Adaptive Engine decided UI. LLM only implemented React from decisions. Cache hits skipped the API.",
      partialFailure: failed.length > 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ensure-components failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
