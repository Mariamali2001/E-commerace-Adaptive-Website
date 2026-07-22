import { NextResponse } from "next/server";
import { resolveGuidelines } from "@/lib/guidelines/resolveGuidelines";
import type { ResolveGuidelinesInput } from "@/lib/guidelines/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolveGuidelinesInput;
    if (!body?.device || (body.device !== "desktop" && body.device !== "mobile")) {
      return NextResponse.json(
        { error: "device must be 'desktop' or 'mobile'" },
        { status: 400 }
      );
    }

    const resolved = resolveGuidelines(body);
    return NextResponse.json({ data: resolved });
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
