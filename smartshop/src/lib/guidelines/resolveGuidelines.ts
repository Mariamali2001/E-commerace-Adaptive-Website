import { AdaptiveEngine } from "@/lib/adaptiveEngine";
import { toResolvedGuidelines } from "@/lib/adaptiveEngine/toResolvedGuidelines";
import { buildContext } from "@/lib/context/buildContext";
import type {
  ResolveGuidelinesInput,
  ResolvedGuidelines,
} from "./types";

/**
 * Runtime guidelines resolver — thin wrapper around AdaptiveEngine.
 * Prefer AdaptiveEngine.generate(context) when a Context Object is available.
 */
export function resolveGuidelines(
  input: ResolveGuidelinesInput
): ResolvedGuidelines {
  const ctx = buildContext({
    device: input.device,
    persona: input.persona,
    guidelineMood: input.mood,
    detectedMood: input.detectedMood,
    traits: input.traits,
  });
  const { configuration } = AdaptiveEngine.generate(ctx);
  return toResolvedGuidelines(configuration);
}
