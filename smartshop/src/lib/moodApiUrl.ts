/** Mood detection backend: Railway EfficientNet vs Modal ViT. */
export type MoodBackend = "efficientnet" | "vit";

export function parseMoodBackend(
  value: string | null | undefined
): MoodBackend {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "vit" || v === "vision" || v === "modal") return "vit";
  return "efficientnet";
}

/** Normalize MOOD_API_URL so host-only Railway values still work. */
export function resolveMoodApiUrl(): string {
  let url = (process.env.MOOD_API_URL ?? "http://127.0.0.1:8001").trim();
  url = url.replace(/\/$/, "");
  if (!url) return "http://127.0.0.1:8001";
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/** Modal ViT endpoint (raw JPEG POST). Set VIT_MOOD_API_URL on Vercel. */
export function resolveVitMoodApiUrl(): string | null {
  let url = (process.env.VIT_MOOD_API_URL ?? "").trim();
  if (!url) return null;
  url = url.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Map ViT labels (anger, …) → FER-style labels used by the shop bridge.
 * EfficientNet already uses angry / happy / …
 */
const VIT_TO_FER: Record<string, string> = {
  anger: "angry",
  angry: "angry",
  disgust: "disgust",
  fear: "fear",
  happy: "happy",
  neutral: "neutral",
  sad: "sad",
  surprise: "surprise",
};

export function normalizeEmotionLabel(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase();
  return VIT_TO_FER[key] ?? key;
}

/** Normalize probability keys to FER-style names. */
export function normalizeProbabilityMap(
  probs: Record<string, number> | null | undefined
): Record<string, number> | null {
  if (!probs || typeof probs !== "object") return null;
  const out: Record<string, number> = {};
  for (const [name, value] of Object.entries(probs)) {
    const key = normalizeEmotionLabel(name) ?? name.toLowerCase();
    out[key] = Number(value);
  }
  return out;
}
