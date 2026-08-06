/**
 * Step 1 — Load guideline JSON once (cached via module import).
 * Adaptive Engine must NOT use AI; uses master matrix + global_defaults fill.
 */
import {
  clearMasterRulesCache,
  getMasterRules,
  type MasterRulesFile,
} from "./masterRules";

export type GuidelineRepos = {
  masterRules: MasterRulesFile;
};

let cache: GuidelineRepos | null = null;

export function getGuidelineRepos(): GuidelineRepos {
  if (cache) return cache;
  cache = { masterRules: getMasterRules() };
  return cache;
}

/** Test helper — clears module cache */
export function clearGuidelineReposCache() {
  cache = null;
  clearMasterRulesCache();
}
