import { NextResponse } from "next/server";
import {
  normalizeEmotionLabel,
  normalizeProbabilityMap,
  parseMoodBackend,
  resolveMoodApiUrl,
  resolveVitMoodApiUrl,
  type MoodBackend,
} from "@/lib/moodApiUrl";

export const runtime = "nodejs";
/** Modal ViT cold start can be long; Vercel Pro allows up to 300s */
export const maxDuration = 300;

function backendFromRequest(request: Request, form?: FormData): MoodBackend {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("backend");
  const fromForm =
    form && typeof form.get("backend") === "string"
      ? String(form.get("backend"))
      : null;
  return parseMoodBackend(fromForm || fromQuery);
}

async function predictEfficientNet(image: Blob) {
  const moodApiUrl = resolveMoodApiUrl();
  const bytes = await image.arrayBuffer();
  const upstream = new FormData();
  upstream.append(
    "image",
    new File([bytes], "frame.jpg", { type: image.type || "image/jpeg" })
  );

  const res = await fetch(`${moodApiUrl}/predict`, {
    method: "POST",
    body: upstream,
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
        backend: "efficientnet" as const,
      },
      { status: res.status }
    );
  }

  return NextResponse.json({
    ...data,
    backend: "efficientnet",
    mood: normalizeEmotionLabel(data.mood) ?? data.mood,
    probabilities: normalizeProbabilityMap(data.probabilities) ?? data.probabilities,
  });
}

async function predictVit(image: Blob) {
  const vitUrl = resolveVitMoodApiUrl();
  if (!vitUrl) {
    return NextResponse.json(
      {
        error:
          "VIT_MOOD_API_URL is not set. Add it in Vercel (Modal predict URL), then redeploy.",
        backend: "vit",
      },
      { status: 503 }
    );
  }

  const bytes = await image.arrayBuffer();
  const res = await fetch(vitUrl, {
    method: "POST",
    headers: {
      "Content-Type": image.type || "image/jpeg",
    },
    body: bytes,
    // Modal GPU cold start can be slow
    signal: AbortSignal.timeout(180_000),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success === false) {
    return NextResponse.json(
      {
        error:
          typeof data?.error === "string"
            ? data.error
            : "ViT Mood API prediction failed.",
        detail: data,
        backend: "vit" as const,
      },
      { status: res.ok ? 502 : res.status }
    );
  }

  const rawEmotion =
    typeof data.emotion === "string"
      ? data.emotion
      : typeof data.mood === "string"
        ? data.mood
        : null;
  const mood = normalizeEmotionLabel(rawEmotion);
  const probabilities = normalizeProbabilityMap(data.probabilities);

  return NextResponse.json({
    face_detected: Boolean(mood),
    mood,
    confidence:
      data.confidence != null && Number.isFinite(Number(data.confidence))
        ? Number(data.confidence)
        : mood && probabilities
          ? probabilities[mood] ?? null
          : null,
    probabilities,
    model: data.model ?? "vit_egypt_ft_v9",
    backend: "vit",
    raw_emotion: rawEmotion,
  });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const backend = backendFromRequest(request, form);
    const image = form.get("image");

    if (!(image instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing image file (field name: image)." },
        { status: 400 }
      );
    }

    if (backend === "vit") {
      return await predictVit(image);
    }
    return await predictEfficientNet(image);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const offline =
      message.includes("fetch failed") ||
      message.includes("ECONNREFUSED") ||
      message.includes("AbortError") ||
      message.toLowerCase().includes("timeout");

    const url = new URL(request.url);
    const backend = parseMoodBackend(url.searchParams.get("backend"));
    const target =
      backend === "vit"
        ? resolveVitMoodApiUrl() ?? "(VIT_MOOD_API_URL unset)"
        : resolveMoodApiUrl();

    return NextResponse.json(
      {
        error: offline
          ? `Mood API (${backend}) is unreachable at ${target}. Check env vars and that Railway/Modal is online.`
          : message,
        backend,
      },
      { status: 503 }
    );
  }
}

export async function GET(request: Request) {
  const backend = backendFromRequest(request);

  if (backend === "vit") {
    const vitUrl = resolveVitMoodApiUrl();
    if (!vitUrl) {
      return NextResponse.json(
        {
          ok: false,
          backend: "vit",
          error:
            "VIT_MOOD_API_URL is not set. Add your Modal URL in Vercel, then redeploy.",
        },
        { status: 503 }
      );
    }
    // Modal has no /health — URL configured means ready to call on Detect
    return NextResponse.json({
      ok: true,
      backend: "vit",
      url: vitUrl,
      note: "ViT endpoint configured (Modal). First Detect may cold-start the GPU.",
    });
  }

  const moodApiUrl = resolveMoodApiUrl();
  try {
    const res = await fetch(`${moodApiUrl}/health`, {
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          backend: "efficientnet",
          error: "Mood API unhealthy",
          detail: data,
          url: moodApiUrl,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({
      ok: true,
      backend: "efficientnet",
      api: data,
      url: moodApiUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        backend: "efficientnet",
        error: `Mood API is unreachable. Set MOOD_API_URL to https://your-service.up.railway.app (include https://). ${message}`,
        url: moodApiUrl,
      },
      { status: 503 }
    );
  }
}
