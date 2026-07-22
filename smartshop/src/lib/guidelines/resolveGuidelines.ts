import globalDefaults from "@/guidelines/global_defaults.json";
import desktopDefaults from "@/guidelines/desktop_defaults.json";
import mobileDefaults from "@/guidelines/mobile_defaults.json";
import personaLookup from "@/guidelines/persona_lookup.json";
import moodLookup from "@/guidelines/mood_lookup.json";
import traitLookup from "@/guidelines/trait_lookup.json";

import { bridgeMoodToGuideline } from "./moodBridge";
import type {
  ResolveGuidelinesInput,
  ResolvedGuidelines,
  TokenValue,
  TraitLevel,
  TraitName,
} from "./types";

type DefaultsFile = {
  defaults: Record<string, { value: string; percentage?: number; count?: number }>;
};

type OverrideBlock = {
  overrides: Record<
    string,
    { value: string; confidence?: number; support?: number; evidence?: string[] }
  >;
};

type TraitBlock = {
  nudges: Record<string, number>;
  confidence?: number;
};

function applyDefaults(
  tokens: Record<string, TokenValue>,
  file: DefaultsFile,
  source: string
) {
  for (const [key, entry] of Object.entries(file.defaults ?? {})) {
    tokens[key] = { value: entry.value, source };
  }
}

function applyOverrides(
  tokens: Record<string, TokenValue>,
  block: OverrideBlock | undefined,
  source: string
) {
  if (!block?.overrides) return;
  for (const [key, entry] of Object.entries(block.overrides)) {
    tokens[key] = {
      value: entry.value,
      source,
      confidence: entry.confidence,
    };
  }
}

/**
 * Runtime guidelines resolver (manifest pipeline order).
 * UI adaptation is applied later — this only resolves tokens.
 */
export function resolveGuidelines(
  input: ResolveGuidelinesInput
): ResolvedGuidelines {
  const pipeline: string[] = [];
  const tokens: Record<string, TokenValue> = {};
  const nudges: Record<string, number> = {};

  const detectedMood = input.detectedMood ?? null;
  const mood =
    input.mood ??
    bridgeMoodToGuideline(detectedMood) ??
    null;

  // 1) global
  applyDefaults(tokens, globalDefaults as DefaultsFile, "global_defaults");
  pipeline.push("global_defaults");

  // 2) device
  if (input.device === "mobile") {
    applyDefaults(tokens, mobileDefaults as DefaultsFile, "mobile_defaults");
    pipeline.push("mobile_defaults");
  } else {
    applyDefaults(tokens, desktopDefaults as DefaultsFile, "desktop_defaults");
    pipeline.push("desktop_defaults");
  }

  // 3) persona
  const persona = input.persona ?? null;
  if (persona && persona in personaLookup) {
    applyOverrides(
      tokens,
      (personaLookup as Record<string, OverrideBlock>)[persona],
      `persona:${persona}`
    );
    pipeline.push(`persona:${persona}`);
  }

  // 4) mood
  if (mood && mood in moodLookup) {
    applyOverrides(
      tokens,
      (moodLookup as Record<string, OverrideBlock>)[mood],
      `mood:${mood}`
    );
    pipeline.push(`mood:${mood}`);
  }

  // 5) traits (nudges)
  const traits: Partial<Record<TraitName, TraitLevel>> = {
    ...(input.traits ?? {}),
  };
  for (const [traitName, level] of Object.entries(traits) as [
    TraitName,
    TraitLevel,
  ][]) {
    const traitRoot = (traitLookup as Record<string, Record<string, TraitBlock>>)[
      traitName
    ];
    const block = traitRoot?.[level];
    if (!block?.nudges) continue;
    for (const [nudgeKey, delta] of Object.entries(block.nudges)) {
      nudges[nudgeKey] = (nudges[nudgeKey] ?? 0) + delta;
    }
    pipeline.push(`trait:${traitName}:${level}`);
  }

  return {
    version: "1.0",
    device: input.device,
    persona,
    mood,
    detectedMood,
    traits,
    tokens,
    nudges,
    pipeline,
  };
}

