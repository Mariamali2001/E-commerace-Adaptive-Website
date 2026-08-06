/**
 * Soft trait nudge layer — TIPI High/Low → small intensity deltas.
 * Never mutates categorical master/global tokens.
 */
import traitModifiers from "../../../public/assets/trait_modifiers.json";
import type { TraitLevel, TraitName } from "@/lib/guidelines/types";

export const NUDGE_KEYS = [
  "information_density",
  "visual_richness",
  "social_proof",
  "recommendation_strength",
] as const;

export type NudgeKey = (typeof NUDGE_KEYS)[number];
export type NudgeMap = Record<NudgeKey, number>;

type TraitModifiersFile = {
  clamp?: { min?: number; max?: number };
  modifiers?: Partial<
    Record<TraitName, Partial<Record<TraitLevel, Partial<Record<NudgeKey, number>>>>>
  >;
};

const file = traitModifiers as TraitModifiersFile;

const CLAMP_MIN = file.clamp?.min ?? -2;
const CLAMP_MAX = file.clamp?.max ?? 2;

function clamp(n: number): number {
  return Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, n));
}

export function emptyNudges(): NudgeMap {
  return {
    information_density: 0,
    visual_richness: 0,
    social_proof: 0,
    recommendation_strength: 0,
  };
}

/**
 * Sum trait modifiers for High/Low levels, clamp each nudge key.
 * Medium / missing traits contribute nothing.
 */
export function applyTraitNudges(
  traits: Partial<Record<TraitName, TraitLevel>>
): {
  nudges: NudgeMap;
  contributions: Array<{ trait: TraitName; level: TraitLevel; deltas: Partial<NudgeMap> }>;
} {
  const nudges = emptyNudges();
  const contributions: Array<{
    trait: TraitName;
    level: TraitLevel;
    deltas: Partial<NudgeMap>;
  }> = [];

  const modifiers = file.modifiers ?? {};

  for (const name of Object.keys(modifiers) as TraitName[]) {
    const level = traits[name];
    if (level !== "High" && level !== "Low") continue;
    const deltas = modifiers[name]?.[level];
    if (!deltas) continue;

    const applied: Partial<NudgeMap> = {};
    for (const key of NUDGE_KEYS) {
      const d = deltas[key];
      if (typeof d === "number" && d !== 0) {
        nudges[key] += d;
        applied[key] = d;
      }
    }
    if (Object.keys(applied).length) {
      contributions.push({ trait: name, level, deltas: applied });
    }
  }

  for (const key of NUDGE_KEYS) {
    nudges[key] = clamp(nudges[key]);
  }

  return { nudges, contributions };
}
