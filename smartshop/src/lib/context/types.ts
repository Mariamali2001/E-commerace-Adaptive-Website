import type {
  DeviceKind,
  GuidelineMood,
  PersonaId,
  TraitLevel,
  TraitName,
} from "@/lib/guidelines/types";
import type { SurveyPersona } from "@/lib/experiment/questions";
import type { ExperimentPhase } from "@/store/experiment";

/** Trait entry in the Context Object (score 1–5 + discrete level). */
export type ContextTrait = {
  level: TraitLevel | "Medium";
  score: number | null;
};

/**
 * Standardized Context Object.
 * Collects / normalizes session facts only — never makes UI decisions.
 */
export type ContextObject = {
  userId: string | null;
  participantId: string | null;
  device: DeviceKind | null;
  persona: PersonaId | string | null;
  surveyPersona: SurveyPersona | string | null;
  mood: {
    selfReported: GuidelineMood | string | null;
    detected: string | null;
    guideline: GuidelineMood | string | null;
    confidence: number | null;
  };
  traits: Partial<Record<TraitName, ContextTrait>>;
  user: {
    age: number | null;
    gender: string | null;
    name?: string | null;
    email?: string | null;
  };
  session: {
    timestamp: string;
    language: string;
    phase: ExperimentPhase | string | null;
  };
};

export type BuildContextInput = {
  userId?: string | null;
  participantId?: string | null;
  device?: DeviceKind | null;
  persona?: PersonaId | string | null;
  surveyPersona?: SurveyPersona | string | null;
  selfReportedMood?: GuidelineMood | string | null;
  detectedMood?: string | null;
  guidelineMood?: GuidelineMood | string | null;
  detectedConfidence?: number | null;
  traits?: Partial<Record<TraitName, TraitLevel>>;
  traitScores?: Partial<Record<TraitName, number>>;
  age?: number | null;
  gender?: string | null;
  name?: string | null;
  email?: string | null;
  phase?: ExperimentPhase | string | null;
  language?: string;
  /** Raw questionnaire answers (age/gender fallback) */
  answers?: Record<string, string>;
  timestamp?: string;
};
