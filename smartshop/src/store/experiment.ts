import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GuidelineMood,
  PersonaId,
  ResolvedGuidelines,
  TraitLevel,
  TraitName,
} from "@/lib/guidelines/types";
import type { SurveyPersona } from "@/lib/experiment/questions";
import type { ContextObject } from "@/lib/context/types";
import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";

export type ExperimentPhase =
  | "idle"
  | "browse"
  | "questionnaire"
  | "mood"
  | "guidelines_ready";

export type QuestionnaireAnswers = Record<string, string>;

type ExperimentState = {
  phase: ExperimentPhase;
  browseStartedAt: number | null;
  browseDurationMs: number;
  device: "desktop" | "mobile" | null;
  surveyPersona: SurveyPersona | null;
  persona: PersonaId | null;
  traits: Partial<Record<TraitName, TraitLevel>>;
  traitScores: Partial<Record<TraitName, number>>;
  selfReportedMood: GuidelineMood | null;
  answers: QuestionnaireAnswers;
  detectedMood: string | null;
  detectedConfidence: number | null;
  guidelines: ResolvedGuidelines | null;
  /** Adaptive Engine output (tokens + nudges + structured log) */
  uiConfig: FinalUIConfiguration | null;
  /** Last built Context Object (no UI decisions) */
  context: ContextObject | null;
  startBrowse: (durationMs?: number) => void;
  setDevice: (device: "desktop" | "mobile") => void;
  setAnswers: (answers: QuestionnaireAnswers) => void;
  setProfileFromQuestionnaire: (payload: {
    surveyPersona: SurveyPersona | null;
    persona: PersonaId | null;
    traits: Partial<Record<TraitName, TraitLevel>>;
    traitScores: Partial<Record<TraitName, number>>;
    selfReportedMood: GuidelineMood | null;
    answers: QuestionnaireAnswers;
  }) => void;
  setMood: (mood: string, confidence: number | null) => void;
  setGuidelines: (guidelines: ResolvedGuidelines) => void;
  setUiConfig: (uiConfig: FinalUIConfiguration | null) => void;
  setContext: (context: ContextObject | null) => void;
  setPhase: (phase: ExperimentPhase) => void;
  reset: () => void;
};

const BROWSE_MS = 3 * 60 * 1000;

export const useExperimentStore = create<ExperimentState>()(
  persist(
    (set) => ({
      phase: "idle",
      browseStartedAt: null,
      browseDurationMs: BROWSE_MS,
      device: null,
      surveyPersona: null,
      persona: null,
      traits: {},
      traitScores: {},
      selfReportedMood: null,
      answers: {},
      detectedMood: null,
      detectedConfidence: null,
      guidelines: null,
      uiConfig: null,
      context: null,
      startBrowse: (durationMs = BROWSE_MS) =>
        set({
          phase: "browse",
          browseStartedAt: Date.now(),
          browseDurationMs: durationMs,
          guidelines: null,
          uiConfig: null,
          context: null,
          detectedMood: null,
          detectedConfidence: null,
        }),
      setDevice: (device) => set({ device }),
      setAnswers: (answers) => set({ answers }),
      setProfileFromQuestionnaire: (payload) =>
        set({
          surveyPersona: payload.surveyPersona,
          persona: payload.persona,
          traits: payload.traits,
          traitScores: payload.traitScores,
          selfReportedMood: payload.selfReportedMood,
          answers: payload.answers,
          phase: "mood",
        }),
      setMood: (mood, confidence) =>
        set({
          detectedMood: mood,
          detectedConfidence: confidence,
        }),
      setGuidelines: (guidelines) =>
        set({
          guidelines,
          phase: "guidelines_ready",
        }),
      setUiConfig: (uiConfig) => set({ uiConfig }),
      setContext: (context) => set({ context }),
      setPhase: (phase) => set({ phase }),
      reset: () =>
        set({
          phase: "idle",
          browseStartedAt: null,
          browseDurationMs: BROWSE_MS,
          device: null,
          surveyPersona: null,
          persona: null,
          traits: {},
          traitScores: {},
          selfReportedMood: null,
          answers: {},
          detectedMood: null,
          detectedConfidence: null,
          guidelines: null,
          uiConfig: null,
          context: null,
        }),
    }),
    { name: "smartshop-experiment-v4" }
  )
);

export function remainingBrowseMs(
  browseStartedAt: number | null,
  browseDurationMs: number
): number {
  if (!browseStartedAt) return browseDurationMs;
  return Math.max(0, browseDurationMs - (Date.now() - browseStartedAt));
}
