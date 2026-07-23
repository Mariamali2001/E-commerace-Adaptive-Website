import { NextResponse } from "next/server";
import { AdaptiveEngine } from "@/lib/adaptiveEngine";
import { toResolvedGuidelines } from "@/lib/adaptiveEngine/toResolvedGuidelines";
import {
  buildContext,
  toResolveGuidelinesInput,
} from "@/lib/context/buildContext";
import type { BuildContextInput, ContextObject } from "@/lib/context/types";
import { persistAdaptationLogAsync } from "@/server/adaptationLog";

type GenerateBody = {
  context?: ContextObject;
  build?: BuildContextInput;
  /** When true (default), write adaptation_logs without blocking response */
  persistLog?: boolean;
};

/**
 * POST /api/adaptive-engine/generate
 * Context Object → Final UI Configuration (rule-based JSON only).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody;

    let context: ContextObject;
    if (body.context) {
      context = body.context;
    } else if (body.build) {
      context = buildContext(body.build);
    } else {
      return NextResponse.json(
        { error: "Provide { context } or { build }" },
        { status: 400 }
      );
    }

    // Ensure device is set for engine
    const resolveInput = toResolveGuidelinesInput(context);
    if (
      resolveInput.device !== "desktop" &&
      resolveInput.device !== "mobile"
    ) {
      return NextResponse.json(
        { error: "context.device must be 'desktop' or 'mobile'" },
        { status: 400 }
      );
    }

    const { configuration } = AdaptiveEngine.generate(context);

    if (body.persistLog !== false) {
      persistAdaptationLogAsync(configuration);
    }

    return NextResponse.json({
      data: configuration,
      /** Backward-compatible ResolvedGuidelines shape */
      guidelines: toResolvedGuidelines(configuration),
      context,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Adaptive Engine generate failed",
      },
      { status: 500 }
    );
  }
}
