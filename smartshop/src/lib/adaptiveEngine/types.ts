import type { ContextObject } from "@/lib/context/types";
import type { DeviceKind, TokenValue, TraitLevel, TraitName } from "@/lib/guidelines/types";

export type AdaptationLogEntry = {
  step: string;
  detail?: string;
  id?: string | null;
  keysApplied?: number;
  keysOverridden?: string[];
  nudges?: Record<string, number>;
  message: string;
};

export type FinalUIConfiguration = {
  version: string;
  source: "adaptive_engine";
  /** No AI — verified JSON repositories only */
  engine: "rule_based_json";
  contextRef: {
    participantId: string | null;
    userId: string | null;
    timestamp: string | null;
  };
  device: DeviceKind;
  persona: string | null;
  mood: string | null;
  detectedMood: string | null;
  traits: Partial<Record<TraitName, TraitLevel>>;
  /**
   * Categorical UI decisions from guideline JSON (repository keys).
   * e.g. desktop_navigation, color_theme_pref, button_style_pref
   */
  tokens: Record<string, TokenValue>;
  /**
   * Soft style adjustments only — never replace categorical tokens.
   * e.g. information_density, recommendation_strength
   */
  nudges: Record<string, number>;
  /** Structured adaptation log (thesis / Mongo) */
  log: AdaptationLogEntry[];
  /** Human-readable pipeline summary */
  pipeline: string[];
  /**
   * Explicit factor fallbacks from the matrix ladder:
   * mood → device → persona (null = exact match used).
   */
  factorFallbacks?: {
    persona: { requested: string | null; used: string } | null;
    device: { requested: string | null; used: string } | null;
    mood: { requested: string | null; used: string } | null;
  } | null;
  /**
   * @deprecated Prefer factorFallbacks.mood — kept for banner/compat.
   */
  moodFallback?: {
    requested: string | null;
    used: string;
  } | null;
  /**
   * Token keys filled from global_defaults.json because the specialized
   * master cell was missing them (never overwrites master values).
   */
  globalFill?: {
    keys: string[];
  } | null;
};

export type AdaptiveEngineResult = {
  configuration: FinalUIConfiguration;
  context: ContextObject;
};
