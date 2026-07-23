/**
 * Step 1 — Load verified JSON repositories once and cache.
 * Adaptive Engine must NOT use AI; only these files.
 */
import globalDefaults from "@/guidelines/global_defaults.json";
import desktopDefaults from "@/guidelines/desktop_defaults.json";
import mobileDefaults from "@/guidelines/mobile_defaults.json";
import personaLookup from "@/guidelines/persona_lookup.json";
import moodLookup from "@/guidelines/mood_lookup.json";
import traitLookup from "@/guidelines/trait_lookup.json";
import manifest from "@/guidelines/manifest.json";

export type DefaultsFile = {
  version?: string;
  defaults: Record<string, { value: string; percentage?: number; count?: number }>;
};

export type OverrideBlock = {
  n_overrides?: number;
  ui_elements?: string[];
  overrides: Record<
    string,
    { value: string; confidence?: number; support?: number; evidence?: string[] }
  >;
};

export type TraitBlock = {
  nudges: Record<string, number>;
  nudge_properties?: string[];
  confidence?: number;
};

export type GuidelineRepos = {
  manifest: typeof manifest;
  globalDefaults: DefaultsFile;
  desktopDefaults: DefaultsFile;
  mobileDefaults: DefaultsFile;
  personaLookup: Record<string, OverrideBlock>;
  moodLookup: Record<string, OverrideBlock>;
  traitLookup: Record<string, Record<string, TraitBlock>>;
};

let cache: GuidelineRepos | null = null;

export function getGuidelineRepos(): GuidelineRepos {
  if (cache) return cache;
  cache = {
    manifest,
    globalDefaults: globalDefaults as DefaultsFile,
    desktopDefaults: desktopDefaults as DefaultsFile,
    mobileDefaults: mobileDefaults as DefaultsFile,
    personaLookup: personaLookup as Record<string, OverrideBlock>,
    moodLookup: moodLookup as Record<string, OverrideBlock>,
    traitLookup: traitLookup as Record<string, Record<string, TraitBlock>>,
  };
  return cache;
}

/** Test helper — clears module cache */
export function clearGuidelineReposCache() {
  cache = null;
}
