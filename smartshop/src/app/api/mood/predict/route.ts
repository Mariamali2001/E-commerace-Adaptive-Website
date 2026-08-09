import { NextResponse } from "next/server";
import { resolveMoodApiUrl } from "@/lib/moodApiUrl";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const moodApiUrl = resolveMoodApiUrl();
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

    const res = await fetch(`${moodApiUrl}/predict`, {
      method: "POST",
      body: upstream,
      // Railway free tier often cold-starts TF — allow longer than local
      signal: AbortSignal.timeout(55_000),
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
          ? `Mood API is unreachable at ${resolveMoodApiUrl()}. Check MOOD_API_URL (must include https://) and that Railway is online.`
          : message,
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  const moodApiUrl = resolveMoodApiUrl();
  try {
    const res = await fetch(`${moodApiUrl}/health`, {
      // Cold start on Railway can exceed 5s
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Mood API unhealthy", detail: data, url: moodApiUrl },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, api: data, url: moodApiUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: `Mood API is unreachable. Set MOOD_API_URL to https://your-service.up.railway.app (include https://). ${message}`,
        url: moodApiUrl,
      },
      { status: 503 }
    );
  }
}
