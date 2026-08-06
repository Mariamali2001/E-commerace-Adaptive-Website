import type { ContextObject } from "@/lib/context/types";
import { toResolveGuidelinesInput } from "@/lib/context/buildContext";
import type { TokenValue, TraitLevel, TraitName } from "@/lib/guidelines/types";
import {
  lookupMasterConfig,
  mergeWithGlobalDefaults,
  tokensFromMasterConfig,
} from "./masterRules";
import { applyTraitNudges } from "./traitNudges";
import type {
  AdaptationLogEntry,
  AdaptiveEngineResult,
  FinalUIConfiguration,
} from "./types";

/**
 * Adaptive Engine — Context Object → Final UI Configuration.
 *
 * Factor ladder (matrix): exact → mood → device → persona
 * Then: global token fill → soft TIPI nudges
 *
 * Sources: master_adaptive_ui_rules.json, global_defaults.json, trait_modifiers.json
 */
export function generate(context: ContextObject): AdaptiveEngineResult {
  const log: AdaptationLogEntry[] = [];
  const pipeline: string[] = [];
  const tokens: Record<string, TokenValue> = {};

  log.push({
    step: "load_repositories",
    message:
      "Loaded master_adaptive_ui_rules.json + global_defaults.json + trait_modifiers.json",
  });

  const input = toResolveGuidelinesInput(context);
  const device = input.device;
  const persona = input.persona ?? null;
  const mood = input.mood ?? null;
  const detectedMood = context.mood.detected;
  const traits: Partial<Record<TraitName, TraitLevel>> = {
    ...(input.traits ?? {}),
  };

  const hit = lookupMasterConfig(persona, device, mood);

  if (!hit) {
    throw new Error(
      `No master adaptive UI rules for persona="${persona}" device="${device}" mood="${mood}"`
    );
  }

  const personaShort =
    hit.personaKey.split("(")[0]?.trim() ?? hit.personaKey;
  const ff = hit.factorFallbacks;

  pipeline.push("master_adaptive_ui_rules");
  pipeline.push(`persona:${personaShort}`);
  pipeline.push(`device:${hit.deviceKey}`);
  pipeline.push(`mood:${hit.moodKey}`);

  if (ff.mood) pipeline.push("mood_fallback");
  if (ff.device) pipeline.push("device_fallback");
  if (ff.persona) pipeline.push("persona_fallback");

  const specialized = tokensFromMasterConfig(hit.config, device);
  for (const [key, value] of Object.entries(specialized)) {
    tokens[key] = {
      value,
      source: `master:${personaShort}/${hit.deviceKey}/${hit.moodKey}`,
    };
  }

  const fallbackParts: string[] = [];
  if (ff.mood) {
    fallbackParts.push(
      `mood "${ff.mood.requested ?? "(none)"}" → "${ff.mood.used}"`
    );
    log.push({
      step: "mood_fallback",
      id: `${ff.mood.requested ?? "none"}→${ff.mood.used}`,
      message: `Mood fallback: requested "${ff.mood.requested ?? "(none)"}" unavailable → using "${ff.mood.used}"`,
    });
  }
  if (ff.device) {
    fallbackParts.push(
      `device "${ff.device.requested}" → "${ff.device.used}"`
    );
    log.push({
      step: "device_fallback",
      id: `${ff.device.requested}→${ff.device.used}`,
      message: `Device fallback: requested "${ff.device.requested}" unavailable → using "${ff.device.used}"`,
    });
  }
  if (ff.persona) {
    fallbackParts.push(
      `persona "${ff.persona.requested ?? "(none)"}" → "${ff.persona.used}"`
    );
    log.push({
      step: "persona_fallback",
      id: `${ff.persona.requested ?? "none"}→${ff.persona.used}`,
      message: `Persona fallback: requested "${ff.persona.requested ?? "(none)"}" unavailable → using "${ff.persona.used}"`,
    });
  }

  log.push({
    step: "master_lookup",
    id: `${personaShort}|${hit.deviceKey}|${hit.moodKey}`,
    keysApplied: Object.keys(tokens).length,
    message: fallbackParts.length
      ? `Master lookup with factor fallbacks (${fallbackParts.join("; ")}) → ${Object.keys(tokens).length} tokens`
      : `Exact master lookup: rules[persona][device][mood] → ${Object.keys(tokens).length} tokens`,
  });

  const merged = mergeWithGlobalDefaults(specialized, device);
  for (const key of merged.filledKeys) {
    tokens[key] = {
      value: merged.tokens[key],
      source: "global_defaults",
    };
  }
  if (merged.filledKeys.length) {
    pipeline.push("global_defaults_fill");
    log.push({
      step: "global_defaults_fill",
      keysApplied: merged.filledKeys.length,
      keysOverridden: merged.filledKeys,
      message: `Filled ${merged.filledKeys.length} missing token(s) from global_defaults.json (dataset-wide Any/Any/Any)`,
    });
  } else {
    log.push({
      step: "global_defaults_fill",
      keysApplied: 0,
      message: "No missing tokens — global defaults not needed",
    });
  }

  const { nudges, contributions } = applyTraitNudges(traits);
  const activeNudgeCount = Object.values(nudges).filter((v) => v !== 0).length;
  if (contributions.length) {
    pipeline.push("trait_nudges");
    log.push({
      step: "trait_nudges",
      keysApplied: activeNudgeCount,
      nudges: { ...nudges },
      message:
        `Applied soft TIPI nudges from ${contributions.length} trait level(s) ` +
        `(${contributions.map((c) => `${c.trait}:${c.level}`).join(", ")}); ` +
        `categorical tokens unchanged`,
    });
  } else {
    log.push({
      step: "trait_nudges",
      keysApplied: 0,
      nudges: { ...nudges },
      message: Object.keys(traits).length
        ? "Traits present but no High/Low modifiers matched"
        : "No traits on context — nudge layer skipped",
    });
  }

  log.push({
    step: "final_ui_configuration",
    keysApplied: Object.keys(tokens).length,
    message: `Generated Final UI Configuration (${Object.keys(tokens).length} categorical tokens, ${activeNudgeCount} active nudges)`,
  });

  const configuration: FinalUIConfiguration = {
    version: "2.1",
    source: "adaptive_engine",
    engine: "rule_based_json",
    contextRef: {
      participantId: context.participantId,
      userId: context.userId,
      timestamp: context.session.timestamp,
    },
    device,
    persona,
    mood: hit.moodKey,
    detectedMood,
    traits,
    tokens,
    nudges,
    log,
    pipeline,
    factorFallbacks: {
      persona: ff.persona ?? null,
      device: ff.device ?? null,
      mood: ff.mood ?? null,
    },
    moodFallback: ff.mood
      ? { requested: ff.mood.requested, used: ff.mood.used }
      : null,
    globalFill: merged.filledKeys.length
      ? { keys: merged.filledKeys }
      : null,
  };

  return { configuration, context };
}

/** Namespace-style API for thesis wording */
export const AdaptiveEngine = {
  generate,
};

export type { FinalUIConfiguration, AdaptationLogEntry, AdaptiveEngineResult };
