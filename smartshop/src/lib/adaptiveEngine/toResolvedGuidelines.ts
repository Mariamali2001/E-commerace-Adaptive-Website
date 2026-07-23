import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import type { ResolvedGuidelines } from "@/lib/guidelines/types";

/** Compatibility shape for existing store / experiment save */
export function toResolvedGuidelines(
  configuration: FinalUIConfiguration
): ResolvedGuidelines {
  return {
    version: configuration.version,
    device: configuration.device,
    persona: configuration.persona,
    mood: configuration.mood,
    detectedMood: configuration.detectedMood,
    traits: configuration.traits,
    tokens: configuration.tokens,
    nudges: configuration.nudges,
    pipeline: configuration.pipeline,
  };
}
