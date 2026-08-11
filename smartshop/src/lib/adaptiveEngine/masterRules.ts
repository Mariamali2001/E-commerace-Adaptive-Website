/**
 * Master Adaptive UI rules — O(1) lookup with explicit factor fallback ladder:
 *   1) exact persona × device × mood
 *   2) relax mood
 *   3) relax device
 *   4) relax persona (Browser → first available)
 *   5) (caller) fill residual tokens from global_defaults.json
 *
 * Sources: public/assets/master_adaptive_ui_rules.json
 *          public/assets/global_defaults.json
 */
import masterRules from "../../../public/assets/master_adaptive_ui_rules.json";
import globalDefaults from "../../../public/assets/global_defaults.json";
import type { DeviceKind } from "@/lib/guidelines/types";

export type MasterUiConfig = Record<string, string>;

export type MasterRulesFile = {
  project?: string;
  description?: string;
  total_personas?: number;
  rules: Record<string, Record<string, Record<string, MasterUiConfig>>>;
};

export type GlobalDefaultsFile = {
  project?: string;
  description?: string;
  version?: string;
  tokens?: Record<string, string>;
};

export type FactorFallback = {
  requested: string | null;
  used: string;
};

export type FactorFallbacks = {
  persona?: FactorFallback;
  device?: FactorFallback;
  mood?: FactorFallback;
};

const rulesFile = masterRules as MasterRulesFile;
const globalFile = globalDefaults as GlobalDefaultsFile;

/** Short website persona → master JSON key (full survey label). */
const PERSONA_TO_MASTER: Record<string, string> = {
  "Impulsive Buyer":
    "The Impulsive Buyer (I make quick decisions based on intuition and emotion. If I like it, I buy it)",
  "Loyal Customer":
    "The Loyal Customer (I stick with brands and stores I trust. I value consistency and reliability)",
  Browser:
    "The Browser (I enjoy browsing and discovering products, often without immediate purchase intent)",
  /** Legacy questionnaire labels (pre-dataset-aligned wording) */
  "Need-based":
    "The Browser (I enjoy browsing and discovering products, often without immediate purchase intent)",
  Entertainment:
    "The Impulsive Buyer (I make quick decisions based on intuition and emotion. If I like it, I buy it)",
  "Gift Buying":
    "The Loyal Customer (I stick with brands and stores I trust. I value consistency and reliability)",
  Minimalist:
    "The Minimalist (I want simple, efficient shopping. Show me what I need with minimal fuss)",
  Researcher:
    "The Researcher (I thoroughly research products, read reviews, compare options, and take my time making informed decisions)",
  "Deal Hunter":
    "The Deal Hunter (I'm motivated by sales, discounts, and getting the best value. I wait for promotions)",
};

const DEVICE_TO_MASTER: Record<DeviceKind, string> = {
  mobile: "Smartphone",
  desktop: "Laptop/Desktop",
};

const FALLBACK_MOODS = [
  "Neutral",
  "Happy",
  "Relaxed",
  "Stressed",
  "Excited",
  "Bored",
  "Sad",
  "Frustrated",
] as const;

let personaKeyCache: Map<string, string> | null = null;

function buildPersonaKeyCache(): Map<string, string> {
  if (personaKeyCache) return personaKeyCache;
  const map = new Map<string, string>();
  for (const full of Object.keys(rulesFile.rules)) {
    map.set(full, full);
    map.set(full.toLowerCase(), full);
    const short = full.split("(")[0]?.trim() ?? full;
    map.set(short, full);
    map.set(short.toLowerCase(), full);
    if (short.startsWith("The ")) {
      const withoutThe = short.slice(4);
      map.set(withoutThe, full);
      map.set(withoutThe.toLowerCase(), full);
    }
  }
  for (const [short, full] of Object.entries(PERSONA_TO_MASTER)) {
    if (full in rulesFile.rules) {
      map.set(short, full);
      map.set(short.toLowerCase(), full);
    }
  }
  personaKeyCache = map;
  return map;
}

export function resolveMasterPersonaKey(
  persona: string | null | undefined
): string | null {
  if (!persona?.trim()) return null;
  const cache = buildPersonaKeyCache();
  return (
    cache.get(persona.trim()) ?? cache.get(persona.trim().toLowerCase()) ?? null
  );
}

export function resolveMasterDeviceKey(device: DeviceKind): string {
  return DEVICE_TO_MASTER[device];
}

function shortPersonaLabel(personaKey: string): string {
  return personaKey.split("(")[0]?.trim() ?? personaKey;
}

function otherDeviceKey(deviceKey: string): string {
  return deviceKey === "Smartphone" ? "Laptop/Desktop" : "Smartphone";
}

function normalizeMoodKey(
  byDevice: Record<string, MasterUiConfig>,
  requestedMood: string
): string | null {
  if (requestedMood in byDevice) return requestedMood;
  const lower = requestedMood.toLowerCase();
  for (const key of Object.keys(byDevice)) {
    if (key.toLowerCase() === lower) return key;
  }
  // Title-case common FER labels: happy → Happy
  const titled =
    requestedMood.charAt(0).toUpperCase() + requestedMood.slice(1).toLowerCase();
  if (titled in byDevice) return titled;
  return null;
}

function pickMoodInBlock(
  byDevice: Record<string, MasterUiConfig>,
  requestedMood: string | null
): { moodKey: string; moodFallback: boolean } | null {
  const available = Object.keys(byDevice);
  if (!available.length) return null;

  if (requestedMood) {
    const exact = normalizeMoodKey(byDevice, requestedMood.trim());
    if (exact) {
      return { moodKey: exact, moodFallback: false };
    }
  }

  for (const candidate of FALLBACK_MOODS) {
    if (candidate in byDevice) {
      return { moodKey: candidate, moodFallback: true };
    }
  }
  return { moodKey: available[0], moodFallback: true };
}

export type MasterLookupResult = {
  config: MasterUiConfig;
  personaKey: string;
  deviceKey: string;
  moodKey: string;
  requestedPersona: string | null;
  requestedDevice: string;
  requestedMood: string | null;
  factorFallbacks: FactorFallbacks;
  /** @deprecated use factorFallbacks.mood */
  usedMoodFallback: boolean;
};

/**
 * Factor fallback ladder (categorical matrix only):
 * mood → device → persona, then caller fills tokens from global defaults.
 */
export function lookupMasterConfig(
  persona: string | null | undefined,
  device: DeviceKind,
  mood: string | null | undefined
): MasterLookupResult | null {
  const requestedPersonaLabel = persona?.trim() || null;
  const requestedPersonaKey = resolveMasterPersonaKey(persona);
  const requestedDeviceKey = resolveMasterDeviceKey(device);
  const requestedMood = mood?.trim() || null;

  const browserKey = resolveMasterPersonaKey("Browser");
  const allPersonas = Object.keys(rulesFile.rules);

  const personaCandidates: string[] = [];
  const pushPersona = (key: string | null | undefined) => {
    if (key && rulesFile.rules[key] && !personaCandidates.includes(key)) {
      personaCandidates.push(key);
    }
  };
  pushPersona(requestedPersonaKey);
  pushPersona(browserKey);
  for (const p of allPersonas) pushPersona(p);

  if (!personaCandidates.length) return null;

  const deviceCandidates = [
    requestedDeviceKey,
    otherDeviceKey(requestedDeviceKey),
  ];

  for (const personaKey of personaCandidates) {
    for (const deviceKey of deviceCandidates) {
      const byDevice = rulesFile.rules[personaKey]?.[deviceKey];
      if (!byDevice) continue;

      const moodPick = pickMoodInBlock(byDevice, requestedMood);
      if (!moodPick) continue;

      const config = byDevice[moodPick.moodKey];
      if (!config || !Object.keys(config).length) continue;

      const factorFallbacks: FactorFallbacks = {};

      if (!requestedPersonaKey || personaKey !== requestedPersonaKey) {
        factorFallbacks.persona = {
          requested: requestedPersonaLabel,
          used: shortPersonaLabel(personaKey),
        };
      }

      if (deviceKey !== requestedDeviceKey) {
        factorFallbacks.device = {
          requested: requestedDeviceKey,
          used: deviceKey,
        };
      }

      if (
        moodPick.moodFallback ||
        (requestedMood &&
          requestedMood.toLowerCase() !== moodPick.moodKey.toLowerCase())
      ) {
        factorFallbacks.mood = {
          requested: requestedMood,
          used: moodPick.moodKey,
        };
      }

      return {
        config,
        personaKey,
        deviceKey,
        moodKey: moodPick.moodKey,
        requestedPersona: requestedPersonaLabel,
        requestedDevice: requestedDeviceKey,
        requestedMood,
        factorFallbacks,
        usedMoodFallback: Boolean(factorFallbacks.mood),
      };
    }
  }

  return null;
}

/** Global (shared) keys + device-prefixed keys for the active device only. */
export function tokensFromMasterConfig(
  config: MasterUiConfig,
  device: DeviceKind
): Record<string, string> {
  const prefix = device === "mobile" ? "mobile_" : "desktop_";
  const other = device === "mobile" ? "desktop_" : "mobile_";
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value !== "string") continue;
    if (key.startsWith(other)) continue;
    const isGlobal =
      !key.startsWith("desktop_") && !key.startsWith("mobile_");
    if (key.startsWith(prefix) || isGlobal) {
      out[key] = value;
    }
  }
  return out;
}

export function getGlobalDefaultTokens(): Record<string, string> {
  const raw = globalFile.tokens ?? {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      typeof value === "string" &&
      value.trim() &&
      value !== "Not enough data"
    ) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Fill keys missing from the specialized master cell using global defaults.
 * Never overwrites an existing specialized value.
 */
export function mergeWithGlobalDefaults(
  specialized: Record<string, string>,
  device: DeviceKind
): { tokens: Record<string, string>; filledKeys: string[] } {
  const globalDevice = tokensFromMasterConfig(getGlobalDefaultTokens(), device);
  const tokens = { ...specialized };
  const filledKeys: string[] = [];

  for (const [key, value] of Object.entries(globalDevice)) {
    const current = tokens[key];
    const missing =
      current == null ||
      !String(current).trim() ||
      String(current) === "Not enough data";
    if (missing) {
      tokens[key] = value;
      filledKeys.push(key);
    }
  }

  return { tokens, filledKeys };
}

export function getMasterRules(): MasterRulesFile {
  return rulesFile;
}

export function getGlobalDefaults(): GlobalDefaultsFile {
  return globalFile;
}

export function clearMasterRulesCache() {
  personaKeyCache = null;
}

export type MasterCombinationRow = {
  persona: string;
  device: DeviceKind;
  deviceLabel: string;
  mood: string;
};

/** The 67 designed persona × device × mood cells in master_adaptive_ui_rules.json */
export function listMasterCombinations(): MasterCombinationRow[] {
  const rows: MasterCombinationRow[] = [];
  for (const [personaKey, byDevice] of Object.entries(rulesFile.rules)) {
    const persona = shortPersonaLabel(personaKey).replace(/^The\s+/i, "");
    for (const [deviceLabel, byMood] of Object.entries(byDevice)) {
      const device: DeviceKind =
        deviceLabel === "Smartphone" ? "mobile" : "desktop";
      for (const mood of Object.keys(byMood)) {
        rows.push({ persona, device, deviceLabel, mood });
      }
    }
  }
  return rows;
}

/** True when an exact master cell exists (no factor fallback needed for that triple). */
export function hasExactMasterCombination(
  persona: string | null | undefined,
  device: DeviceKind,
  mood: string | null | undefined
): boolean {
  const personaKey = resolveMasterPersonaKey(persona);
  if (!personaKey || !mood?.trim()) return false;
  const deviceKey = resolveMasterDeviceKey(device);
  const byDevice = rulesFile.rules[personaKey]?.[deviceKey];
  if (!byDevice) return false;
  return normalizeMoodKey(byDevice, mood.trim()) != null;
}
