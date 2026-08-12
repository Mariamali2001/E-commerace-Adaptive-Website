import { NextResponse } from "next/server";
import { resolveVitMoodApiUrl } from "@/lib/moodApiUrl";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Small valid JPEG used only to wake Modal (not for real mood labels). */
function warmupJpegBytes(): Buffer {
  // 1×1 pixel JPEG
  return Buffer.from(
    "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d383232ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffc00011080001000103011100021100031101ffc40014000100000000000000000000000000000008ffc40014100100000000000000000000000000000000ffda000c0301000210031000003f00bf80ffd9",
    "hex"
  );
}

/** Fire a cheap POST at Modal so the next Detect is warmer. */
export async function POST() {
  const vitUrl = resolveVitMoodApiUrl();
  if (!vitUrl) {
    return NextResponse.json(
      { ok: false, error: "VIT_MOOD_API_URL is not set" },
      { status: 503 }
    );
  }

  const started = Date.now();
  try {
    const res = await fetch(vitUrl, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: warmupJpegBytes(),
      signal: AbortSignal.timeout(180_000),
    });
    const text = await res.text();
    let detail: unknown = null;
    try {
      detail = JSON.parse(text);
    } catch {
      detail = { raw: text.slice(0, 200) };
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      url: vitUrl,
      detail,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        ms: Date.now() - started,
        error: err instanceof Error ? err.message : "Warm-up failed",
        url: vitUrl,
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  return POST();
}
