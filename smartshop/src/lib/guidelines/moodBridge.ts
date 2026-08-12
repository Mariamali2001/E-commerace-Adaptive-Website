import type { GuidelineMood } from "./types";

/**
 * Bridge face-model labels (FER / Egypt .h5) → survey guideline moods.
 * Thesis note: this is an explicit mapping layer; refine later with study data.
 */
const FER_TO_GUIDELINE: Record<string, GuidelineMood> = {
  happy: "Happy",
  sad: "Sad",
  neutral: "Neutral",
  angry: "Frustrated",
  anger: "Frustrated", // ViT label
  fear: "Stressed",
  surprise: "Excited",
  disgust: "Frustrated",
  // already-guideline labels
  bored: "Bored",
  excited: "Excited",
  frustrated: "Frustrated",
  relaxed: "Relaxed",
  stressed: "Stressed",
};

export function bridgeMoodToGuideline(
  raw: string | null | undefined
): GuidelineMood | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return FER_TO_GUIDELINE[key] ?? null;
}
