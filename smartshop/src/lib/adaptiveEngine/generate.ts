import type { ContextObject } from "@/lib/context/types";
import { toResolveGuidelinesInput } from "@/lib/context/buildContext";
import type { TokenValue, TraitLevel, TraitName } from "@/lib/guidelines/types";
import { getGuidelineRepos, type DefaultsFile, type OverrideBlock } from "./repos";
import type {
  AdaptationLogEntry,
  AdaptiveEngineResult,
  FinalUIConfiguration,
} from "./types";

function applyDefaults(
  tokens: Record<string, TokenValue>,
  file: DefaultsFile,
  source: string
): string[] {
  const keys: string[] = [];
  for (const [key, entry] of Object.entries(file.defaults ?? {})) {
    tokens[key] = { value: entry.value, source };
    keys.push(key);
  }
  return keys;
}

function applyOverrides(
  tokens: Record<string, TokenValue>,
  block: OverrideBlock | undefined,
  source: string
): string[] {
  if (!block?.overrides) return [];
  const keys: string[] = [];
  for (const [key, entry] of Object.entries(block.overrides)) {
    // Only override properties explicitly present in the lookup JSON
    tokens[key] = {
      value: entry.value,
      source,
      confidence: entry.confidence,
    };
    keys.push(key);
  }
  return keys;
}

/**
 * Adaptive Engine — Context Object → Final UI Configuration.
 *
 * MUST NOT use AI.
 * MUST only use verified JSON repositories (cached).
 * Trait nudges NEVER replace categorical UI decisions.
 */
export function generate(context: ContextObject): AdaptiveEngineResult {
  const repos = getGuidelineRepos();
  const log: AdaptationLogEntry[] = [];
  const pipeline: string[] = [];
  const tokens: Record<string, TokenValue> = {};
  const nudges: Record<string, number> = {};

  log.push({
    step: "load_repositories",
    message: "Loaded Global / Desktop / Mobile / Persona / Mood / Trait JSON (cached)",
  });

  const input = toResolveGuidelinesInput(context);
  const device = input.device;
  const persona = input.persona ?? null;
  const mood = input.mood ?? null;
  const detectedMood = context.mood.detected;
  const traits: Partial<Record<TraitName, TraitLevel>> = {
    ...(input.traits ?? {}),
  };

  // STEP 3 — Global defaults
  {
    const keys = applyDefaults(tokens, repos.globalDefaults, "global_defaults");
    pipeline.push("global_defaults");
    log.push({
      step: "global_defaults",
      keysApplied: keys.length,
      message: "Loaded Global Defaults",
    });
  }

  // STEP 4 — Device defaults
  if (device === "mobile") {
    const keys = applyDefaults(tokens, repos.mobileDefaults, "mobile_defaults");
    pipeline.push("mobile_defaults");
    log.push({
      step: "mobile_defaults",
      keysApplied: keys.length,
      message: "Loaded Mobile Defaults",
    });
  } else {
    const keys = applyDefaults(tokens, repos.desktopDefaults, "desktop_defaults");
    pipeline.push("desktop_defaults");
    log.push({
      step: "desktop_defaults",
      keysApplied: keys.length,
      message: "Loaded Desktop Defaults",
    });
  }

  // STEP 5 — Persona overrides (explicit keys only)
  if (persona && persona in repos.personaLookup) {
    const keys = applyOverrides(
      tokens,
      repos.personaLookup[persona],
      `persona:${persona}`
    );
    pipeline.push(`persona:${persona}`);
    log.push({
      step: "persona_overrides",
      id: persona,
      keysOverridden: keys,
      keysApplied: keys.length,
      message: `Applied Persona Override (${persona})`,
    });
  } else {
    log.push({
      step: "persona_overrides",
      id: persona,
      keysApplied: 0,
      message: persona
        ? `No persona lookup for "${persona}" — skipped`
        : "No persona in context — skipped",
    });
  }

  // STEP 6 — Mood overrides (precedence over persona on same key)
  if (mood && mood in repos.moodLookup) {
    const keys = applyOverrides(tokens, repos.moodLookup[mood], `mood:${mood}`);
    pipeline.push(`mood:${mood}`);
    log.push({
      step: "mood_overrides",
      id: mood,
      keysOverridden: keys,
      keysApplied: keys.length,
      message: `Applied Mood Override (${mood}) — precedence over persona on same keys`,
    });
  } else {
    log.push({
      step: "mood_overrides",
      id: mood,
      keysApplied: 0,
      message: mood
        ? `No mood lookup for "${mood}" — skipped`
        : "No guideline mood in context — skipped",
    });
  }

  // STEP 7 — Personality nudges (additive only; never replace categorical tokens)
  for (const [traitName, level] of Object.entries(traits) as [
    TraitName,
    TraitLevel,
  ][]) {
    const block = repos.traitLookup[traitName]?.[level];
    if (!block?.nudges) continue;
    const applied: Record<string, number> = {};
    for (const [nudgeKey, delta] of Object.entries(block.nudges)) {
      nudges[nudgeKey] = (nudges[nudgeKey] ?? 0) + delta;
      applied[nudgeKey] = delta;
    }
    pipeline.push(`trait:${traitName}:${level}`);
    log.push({
      step: "trait_nudges",
      id: `${traitName}:${level}`,
      nudges: applied,
      message: `Applied Trait Modifier (${traitName} ${level}) — nudges only`,
    });
  }

  if (!Object.keys(nudges).length) {
    log.push({
      step: "trait_nudges",
      keysApplied: 0,
      message: "No trait nudges applied",
    });
  }

  // STEP 8–10 — Final UI Configuration + log
  log.push({
    step: "final_ui_configuration",
    keysApplied: Object.keys(tokens).length,
    message: `Generated Final UI Configuration (${Object.keys(tokens).length} categorical tokens, ${Object.keys(nudges).length} nudge keys)`,
  });

  const configuration: FinalUIConfiguration = {
    version: "1.0",
    source: "adaptive_engine",
    engine: "rule_based_json",
    contextRef: {
      participantId: context.participantId,
      userId: context.userId,
      timestamp: context.session.timestamp,
    },
    device,
    persona,
    mood,
    detectedMood,
    traits,
    tokens,
    nudges,
    log,
    pipeline,
  };

  return { configuration, context };
}

/** Namespace-style API for thesis wording */
export const AdaptiveEngine = {
  generate,
};

export type { FinalUIConfiguration, AdaptationLogEntry, AdaptiveEngineResult };
