import { NextResponse } from "next/server";
import { AdaptiveEngine } from "@/lib/adaptiveEngine";
import { toResolvedGuidelines } from "@/lib/adaptiveEngine/toResolvedGuidelines";
import { resolveGuidelines } from "@/lib/guidelines/resolveGuidelines";
import type { ResolveGuidelinesInput } from "@/lib/guidelines/types";
import {
  buildContext,
  toResolveGuidelinesInput,
} from "@/lib/context/buildContext";
import type { BuildContextInput, ContextObject } from "@/lib/context/types";
import { persistAdaptationLogAsync } from "@/server/adaptationLog";

type ResolveBody = ResolveGuidelinesInput & {
  context?: ContextObject;
  build?: BuildContextInput;
  persistLog?: boolean;
};

/**
 * POST /api/guidelines/resolve
 * Prefer Adaptive Engine when Context Object is present.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolveBody;

    let resolveInput: ResolveGuidelinesInput;
    let context: ContextObject | null = null;

    if (body.context) {
      context = body.context;
      resolveInput = toResolveGuidelinesInput(body.context);
    } else if (body.build) {
      context = buildContext(body.build);
      resolveInput = toResolveGuidelinesInput(context);
    } else {
      resolveInput = body;
    }

    if (
      !resolveInput?.device ||
      (resolveInput.device !== "desktop" && resolveInput.device !== "mobile")
    ) {
      return NextResponse.json(
        { error: "device must be 'desktop' or 'mobile'" },
        { status: 400 }
      );
    }

    if (context) {
      const { configuration } = AdaptiveEngine.generate(context);
      if (body.persistLog !== false) {
        persistAdaptationLogAsync(configuration);
      }
      return NextResponse.json({
        data: toResolvedGuidelines(configuration),
        configuration,
        context,
      });
    }

    const resolved = resolveGuidelines(resolveInput);
    return NextResponse.json({ data: resolved, context });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to resolve guidelines",
      },
      { status: 500 }
    );
  }
}
