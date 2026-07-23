import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import { buildContext } from "@/lib/context/buildContext";
import type { BuildContextInput } from "@/lib/context/types";

/**
 * Build a Context Object from posted fields (+ logged-in user if present).
 * Does not resolve guidelines or change UI.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BuildContextInput;
    const user = await getCurrentUser().catch(() => null);

    const context = buildContext({
      ...body,
      userId: body.userId ?? user?.id ?? null,
      participantId: body.participantId ?? body.userId ?? user?.id ?? null,
      name: body.name ?? user?.name ?? null,
      email: body.email ?? user?.email ?? null,
      age: body.age ?? user?.age ?? null,
      gender: body.gender ?? user?.gender ?? null,
    });

    return NextResponse.json({ data: context });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to build context",
      },
      { status: 500 }
    );
  }
}
