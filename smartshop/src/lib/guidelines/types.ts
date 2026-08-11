export type DeviceKind = "desktop" | "mobile";

export type GuidelineMood =
  | "Bored"
  | "Excited"
  | "Frustrated"
  | "Happy"
  | "Neutral"
  | "Relaxed"
  | "Sad"
  | "Stressed";

/** Canonical mood set for validation UI + adaptation (not raw FER labels). */
export const GUIDELINE_MOODS: readonly GuidelineMood[] = [
  "Bored",
  "Excited",
  "Frustrated",
  "Happy",
  "Neutral",
  "Relaxed",
  "Sad",
  "Stressed",
] as const;

export type PersonaId =
  | "Browser"
  | "Deal Hunter"
  | "Impulsive Buyer"
  | "Loyal Customer"
  | "Minimalist"
  | "Researcher";

export type TraitName =
  | "Extraversion"
  | "Agreeableness"
  | "Conscientiousness"
  | "Neuroticism"
  | "Openness";

export type TraitLevel = "High" | "Low";

export type TokenValue = {
  value: string;
  source: string;
  confidence?: number;
};

export type ResolveGuidelinesInput = {
  device: DeviceKind;
  persona?: PersonaId | string | null;
  mood?: GuidelineMood | string | null;
  /** Optional FER / model mood; bridged to guideline mood if mood not set */
  detectedMood?: string | null;
  traits?: Partial<Record<TraitName, TraitLevel>>;
};

export type ResolvedGuidelines = {
  version: string;
  device: DeviceKind;
  persona: string | null;
  mood: string | null;
  detectedMood: string | null;
  traits: Partial<Record<TraitName, TraitLevel>>;
  tokens: Record<string, TokenValue>;
  nudges: Record<string, number>;
  pipeline: string[];
};
