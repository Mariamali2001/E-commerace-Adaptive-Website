import { bridgeMoodToGuideline } from "@/lib/guidelines/moodBridge";
import type {
  ResolveGuidelinesInput,
  TraitLevel,
  TraitName,
} from "@/lib/guidelines/types";
import type { BuildContextInput, ContextObject, ContextTrait } from "./types";

const TRAIT_NAMES: TraitName[] = [
  "Extraversion",
  "Agreeableness",
  "Conscientiousness",
  "Neuroticism",
  "Openness",
];

/**
 * Map continuous TIPI score (1–5) to High / Medium / Low for the Context Object.
 * Resolver still uses High/Low via toResolveGuidelinesInput().
 */
export function traitLevelFromScore(score: number): TraitLevel | "Medium" {
  if (score >= 3.5) return "High";
  if (score <= 2.5) return "Low";
  return "Medium";
}

function parseAge(input: BuildContextInput): number | null {
  if (input.age != null && Number.isFinite(Number(input.age))) {
    return Number(input.age);
  }
  const fromAnswers = Number(input.answers?.age);
  return Number.isFinite(fromAnswers) ? fromAnswers : null;
}

function parseGender(input: BuildContextInput): string | null {
  if (typeof input.gender === "string" && input.gender.trim()) {
    return input.gender.trim();
  }
  const g = input.answers?.gender?.trim();
  return g || null;
}

function buildTraits(input: BuildContextInput): ContextObject["traits"] {
  const out: ContextObject["traits"] = {};
  for (const name of TRAIT_NAMES) {
    const score = input.traitScores?.[name];
    const storedLevel = input.traits?.[name];
    if (score == null && !storedLevel) continue;

    const level: ContextTrait["level"] =
      score != null ? traitLevelFromScore(score) : (storedLevel as TraitLevel);

    out[name] = {
      level,
      score: score ?? null,
    };
  }
  return out;
}

/**
 * Context Builder — gather & normalize only.
 * Does NOT choose UI tokens or layout.
 */
export function buildContext(input: BuildContextInput): ContextObject {
  const detected = input.detectedMood ?? null;
  const guideline =
    input.guidelineMood ??
    bridgeMoodToGuideline(detected) ??
    (typeof input.selfReportedMood === "string"
      ? input.selfReportedMood
      : null);

  const userId = input.userId ?? null;
  const participantId = input.participantId ?? userId;

  return {
    userId,
    participantId,
    device: input.device ?? null,
    persona: input.persona ?? null,
    surveyPersona: input.surveyPersona ?? null,
    mood: {
      selfReported: input.selfReportedMood ?? null,
      detected,
      guideline,
      confidence:
        input.detectedConfidence != null &&
        Number.isFinite(input.detectedConfidence)
          ? Number(input.detectedConfidence)
          : null,
    },
    traits: buildTraits(input),
    user: {
      age: parseAge(input),
      gender: parseGender(input),
      name: input.name ?? null,
      email: input.email ?? null,
    },
    session: {
      timestamp: input.timestamp ?? new Date().toISOString(),
      language: input.language ?? "en",
      phase: input.phase ?? null,
    },
  };
}

/**
 * Map Context Object → guidelines resolver input (still no UI decisions here).
 * Medium traits → High if score > 3, else Low (matches prior High/Low lookup files).
 */
export function toResolveGuidelinesInput(
  ctx: ContextObject
): ResolveGuidelinesInput {
  const traits: ResolveGuidelinesInput["traits"] = {};
  for (const [name, entry] of Object.entries(ctx.traits) as [
    TraitName,
    ContextTrait,
  ][]) {
    if (!entry) continue;
    if (entry.level === "High" || entry.level === "Low") {
      traits[name] = entry.level;
    } else if (entry.score != null) {
      traits[name] = entry.score > 3 ? "High" : "Low";
    } else {
      traits[name] = "Low";
    }
  }

  return {
    device: ctx.device ?? "desktop",
    persona: ctx.persona,
    mood: ctx.mood.guideline,
    detectedMood: ctx.mood.detected,
    traits,
  };
}
