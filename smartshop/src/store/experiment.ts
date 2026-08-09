import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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
import type { GeneratedComponentBundle } from "@/llm/LLMTypes";

export type ExperimentPhase =
  | "idle"
  | "browse"
  | "questionnaire"
  | "mood"
  | "guidelines_ready";

export type QuestionnaireAnswers = Record<string, string>;

export type GeneratedUiStatus = "idle" | "loading" | "ready" | "error";

type ExperimentState = {
  phase: ExperimentPhase;
  browseStartedAt: number | null;
  browseDurationMs: number;
  device: "desktop" | "mobile" | null;
  surveyPersona: SurveyPersona | string | null;
  persona: PersonaId | null;
  traits: Partial<Record<TraitName, TraitLevel>>;
  traitScores: Partial<Record<TraitName, number>>;
  selfReportedMood: GuidelineMood | null;
  answers: QuestionnaireAnswers;
  detectedMood: string | null;
  detectedConfidence: number | null;
  guidelines: ResolvedGuidelines | null;
  uiConfig: FinalUIConfiguration | null;
  context: ContextObject | null;
  /** LLM component generator bundle (decisions → React), cached by hash */
  generatedBundle: GeneratedComponentBundle | null;
  generatedUiStatus: GeneratedUiStatus;
  generatedUiError: string | null;
  startBrowse: (durationMs?: number) => void;
  setDevice: (device: "desktop" | "mobile") => void;
  setAnswers: (answers: QuestionnaireAnswers) => void;
  setProfileFromQuestionnaire: (payload: {
    surveyPersona: SurveyPersona | string | null;
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
  setGeneratedBundle: (bundle: GeneratedComponentBundle | null) => void;
  setGeneratedUiStatus: (
    status: GeneratedUiStatus,
    error?: string | null
  ) => void;
  setPhase: (phase: ExperimentPhase) => void;
  reset: () => void;
};

const BROWSE_MS = 3 * 60 * 1000;

const emptyGenerated = {
  generatedBundle: null as GeneratedComponentBundle | null,
  generatedUiStatus: "idle" as GeneratedUiStatus,
  generatedUiError: null as string | null,
};

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
      ...emptyGenerated,
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
          ...emptyGenerated,
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
      setGeneratedBundle: (generatedBundle) =>
        set({
          generatedBundle,
          generatedUiStatus: generatedBundle ? "ready" : "idle",
          generatedUiError: null,
        }),
      setGeneratedUiStatus: (status, error = null) =>
        set({ generatedUiStatus: status, generatedUiError: error }),
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
          ...emptyGenerated,
        }),
    }),
    {
      name: "smartshop-experiment-v7",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        phase: state.phase,
        browseStartedAt: state.browseStartedAt,
        browseDurationMs: state.browseDurationMs,
        device: state.device,
        surveyPersona: state.surveyPersona,
        persona: state.persona,
        traits: state.traits,
        traitScores: state.traitScores,
        selfReportedMood: state.selfReportedMood,
        answers: state.answers,
        detectedMood: state.detectedMood,
        detectedConfidence: state.detectedConfidence,
        guidelines: state.guidelines,
        uiConfig: state.uiConfig,
        context: state.context,
        generatedBundle: state.generatedBundle,
        generatedUiStatus: state.generatedUiStatus,
        generatedUiError: state.generatedUiError,
      }),
    }
  )
);

export function remainingBrowseMs(
  browseStartedAt: number | null,
  browseDurationMs: number
): number {
  if (!browseStartedAt) return browseDurationMs;
  return Math.max(0, browseDurationMs - (Date.now() - browseStartedAt));
}
