import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MOOD_API_URL = process.env.MOOD_API_URL ?? "http://127.0.0.1:8001";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");

    if (!(image instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing image file (field name: image)." },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const upstream = new FormData();
    upstream.append(
      "image",
      new File([bytes], "frame.jpg", { type: image.type || "image/jpeg" })
    );

    const res = await fetch(`${MOOD_API_URL}/predict`, {
      method: "POST",
      body: upstream,
      signal: AbortSignal.timeout(30_000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            typeof data?.detail === "string"
              ? data.detail
              : "Mood API prediction failed.",
          detail: data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const offline =
      message.includes("fetch failed") ||
      message.includes("ECONNREFUSED") ||
      message.includes("AbortError") ||
      message.toLowerCase().includes("timeout");

    return NextResponse.json(
      {
        error: offline
          ? "Mood API is not running. Start it with: python mood_api.py (in smartshop/mood_model)"
          : message,
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(`${MOOD_API_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Mood API unhealthy", detail: data },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, api: data });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Mood API is not running. Start it with: python mood_api.py (in smartshop/mood_model)",
      },
      { status: 503 }
    );
  }
}
