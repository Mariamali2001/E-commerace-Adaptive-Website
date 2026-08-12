"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WebcamCapture } from "@/components/mood/WebcamCapture";
import { MoodConfirmStep } from "@/components/mood/MoodConfirmStep";
import { useExperimentStore } from "@/store/experiment";
import { detectDeviceClient } from "@/lib/guidelines/device";
import { bridgeMoodToGuideline } from "@/lib/guidelines/moodBridge";
import {
  GUIDELINE_MOODS,
  type GuidelineMood,
} from "@/lib/guidelines/types";
import { buildContext } from "@/lib/context/buildContext";
import type { ContextObject } from "@/lib/context/types";
import type { FinalUIConfiguration } from "@/lib/adaptiveEngine/types";
import type { ResolvedGuidelines } from "@/lib/guidelines/types";
import type { GeneratedComponentBundle } from "@/llm/LLMTypes";

/** Core surfaces warmed after each Final UI Configuration */
const ENSURE_COMPONENTS = [
  "Navbar",
  "HeroBanner",
  "ProductCard",
  "ProductGrid",
  "FilterPanel",
  "RecommendationSection",
  "ReviewSection",
  "Footer",
  "Checkout",
  "SearchBar",
  "CategorySection",
] as const;

type PendingDetection = {
  rawMood: string;
  predictedGuideline: GuidelineMood;
  confidence: number | null;
  imageBase64: string | null;
  moodBackend: "efficientnet" | "vit";
};

export function ExperimentMoodFlow() {
  const searchParams = useSearchParams();
  const inExperiment = searchParams.get("experiment") === "1";

  const persona = useExperimentStore((s) => s.persona);
  const surveyPersona = useExperimentStore((s) => s.surveyPersona);
  const traits = useExperimentStore((s) => s.traits);
  const traitScores = useExperimentStore((s) => s.traitScores);
  const answers = useExperimentStore((s) => s.answers);
  const selfReportedMood = useExperimentStore((s) => s.selfReportedMood);
  const setDevice = useExperimentStore((s) => s.setDevice);
  const setMood = useExperimentStore((s) => s.setMood);
  const setGuidelines = useExperimentStore((s) => s.setGuidelines);
  const setUiConfig = useExperimentStore((s) => s.setUiConfig);
  const setContext = useExperimentStore((s) => s.setContext);
  const setGeneratedBundle = useExperimentStore((s) => s.setGeneratedBundle);
  const setGeneratedUiStatus = useExperimentStore(
    (s) => s.setGeneratedUiStatus
  );
  const generatedUiStatus = useExperimentStore((s) => s.generatedUiStatus);
  const generatedUiError = useExperimentStore((s) => s.generatedUiError);
  const guidelines = useExperimentStore((s) => s.guidelines);
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const detectedMood = useExperimentStore((s) => s.detectedMood);

  const [resolving, setResolving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDetection | null>(null);
  const [correcting, setCorrecting] = useState(false);

  const saveMoodFeedback = useCallback(
    async (payload: {
      predictedRaw: string | null;
      predictedGuideline: string;
      confirmedGuideline: string;
      wasCorrect: boolean;
      confidence: number | null;
      imageBase64: string | null;
      moodBackend?: "efficientnet" | "vit" | null;
    }) => {
      if (!payload.imageBase64) return;
      try {
        await fetch("/api/mood/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } catch {
        /* non-blocking — adaptation still proceeds */
      }
    },
    []
  );

  const resolve = useCallback(
    async (opts: {
      /** Raw model FER label when camera was used */
      detectedRaw: string | null;
      /** Bridged prediction shown before confirm (camera) */
      predictedGuideline: string | null;
      /** Mood that drives adaptation */
      confirmedMood: string;
      confidence: number | null;
      moodWasCorrect: boolean | null;
      moodSource: "camera" | "manual";
      imageBase64?: string | null;
      moodBackend?: "efficientnet" | "vit" | null;
    }) => {
      if (!inExperiment) return;
      setMood(opts.detectedRaw ?? opts.confirmedMood, opts.confidence);
      setResolving(true);
      setSaved(false);
      setError(null);
      setPending(null);
      setCorrecting(false);

      try {
        if (opts.moodSource === "camera" && opts.predictedGuideline) {
          await saveMoodFeedback({
            predictedRaw: opts.detectedRaw,
            predictedGuideline: opts.predictedGuideline,
            confirmedGuideline: opts.confirmedMood,
            wasCorrect: Boolean(opts.moodWasCorrect),
            confidence: opts.confidence,
            imageBase64: opts.imageBase64 ?? null,
            moodBackend: opts.moodBackend ?? null,
          });
        }

        const device = detectDeviceClient();
        setDevice(device);

        let auth: {
          id?: string;
          name?: string;
          email?: string;
          age?: number | null;
          gender?: string | null;
        } | null = null;
        try {
          const meRes = await fetch("/api/auth/me", { credentials: "include" });
          if (meRes.ok) {
            const me = await meRes.json();
            auth = me.data;
          }
        } catch {
          /* optional */
        }

        const age =
          auth?.age != null && Number.isFinite(Number(auth.age))
            ? Number(auth.age)
            : null;
        const gender =
          typeof auth?.gender === "string" && auth.gender.trim()
            ? auth.gender.trim()
            : null;

        // 1) Context Builder — adaptation uses confirmed guideline mood
        const ctx: ContextObject = buildContext({
          userId: auth?.id ?? null,
          participantId: auth?.id ?? null,
          device,
          persona,
          surveyPersona,
          selfReportedMood,
          detectedMood: opts.detectedRaw,
          guidelineMood: opts.confirmedMood,
          detectedConfidence: opts.confidence,
          traits,
          traitScores,
          age,
          gender,
          name: auth?.name ?? null,
          email: auth?.email ?? null,
          answers,
          phase: "mood",
          language: "en",
        });
        setContext(ctx);

        // 2) Adaptive Engine — only decision maker
        const res = await fetch("/api/adaptive-engine/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: ctx }),
        });
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || "Adaptive Engine failed");
        }
        const configuration = payload.data as FinalUIConfiguration;
        const resolved = (payload.guidelines ??
          configuration) as ResolvedGuidelines;
        if (payload.context) setContext(payload.context as ContextObject);
        setUiConfig(configuration);
        setGuidelines(resolved);

        const uiElements: Record<string, string> = {};
        for (const [key, tok] of Object.entries(configuration.tokens)) {
          uiElements[key] = tok.value;
        }

        // 3) LLM Component Generator — ImplementationSpec only → React/TSX
        setGeneratedUiStatus("loading");
        setGeneratedBundle(null);
        try {
          const genRes = await fetch("/api/llm/ensure-components", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              configuration,
              components: [...ENSURE_COMPONENTS],
            }),
          });
          const genPayload = await genRes.json();
          if (!genRes.ok) {
            throw new Error(
              genPayload.error || "LLM component generation failed"
            );
          }
          setGeneratedBundle(genPayload.data as GeneratedComponentBundle);
        } catch (genErr) {
          setGeneratedUiStatus(
            "error",
            genErr instanceof Error
              ? genErr.message
              : "LLM component generation failed"
          );
        }

        // 4) Persist experiment
        const saveRes = await fetch("/api/experiment/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            device: ctx.device,
            answers: {
              ...answers,
              _context: JSON.stringify(ctx),
              _adaptation_log: JSON.stringify(configuration.log),
            },
            age,
            gender,
            surveyPersona: ctx.surveyPersona,
            guidelinePersona: configuration.persona,
            traitScores,
            traitLevels: traits,
            selfReportedMood: ctx.mood.selfReported,
            detectedMood: opts.detectedRaw,
            detectedConfidence: opts.confidence,
            predictedGuidelineMood: opts.predictedGuideline,
            confirmedMood: opts.confirmedMood,
            moodWasCorrect: opts.moodWasCorrect,
            moodSource: opts.moodSource,
            moodBackend: opts.moodBackend ?? null,
            guidelineMood: configuration.mood,
            uiElements,
            guidelinesPipeline: configuration.pipeline,
          }),
        });
        const savePayload = await saveRes.json();
        if (!saveRes.ok) {
          throw new Error(savePayload.error || "Could not save experiment data");
        }
        setSaved(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Adaptive Engine failed"
        );
      } finally {
        setResolving(false);
      }
    },
    [
      answers,
      inExperiment,
      persona,
      saveMoodFeedback,
      selfReportedMood,
      setContext,
      setDevice,
      setGuidelines,
      setMood,
      setUiConfig,
      setGeneratedBundle,
      setGeneratedUiStatus,
      surveyPersona,
      traitScores,
      traits,
    ]
  );

  const onCameraMood = useCallback(
    ({
      mood,
      confidence,
      imageBase64,
      moodBackend,
    }: {
      mood: string;
      confidence: number | null;
      imageBase64: string | null;
      moodBackend: "efficientnet" | "vit";
    }) => {
      if (!inExperiment || resolving || pending) return;
      const bridged = bridgeMoodToGuideline(mood);
      if (!bridged) {
        setError(
          `Could not map detected mood "${mood}" to a guideline mood. Please pick a mood manually.`
        );
        return;
      }
      setError(null);
      setCorrecting(false);
      setPending({
        rawMood: mood,
        predictedGuideline: bridged,
        confidence,
        imageBase64,
        moodBackend,
      });
    },
    [inExperiment, pending, resolving]
  );

  return (
    <div className="space-y-6">
      {inExperiment && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          Step: look at the camera and detect your mood. We will ask you to
          confirm it before personalizing the shop. Use the buttons below only
          if the camera is unavailable.
        </div>
      )}

      <WebcamCapture
        detectionLocked={Boolean(pending) || resolving}
        onMoodDetected={onCameraMood}
      />

      {inExperiment && pending && (
        <MoodConfirmStep
          predictedGuideline={pending.predictedGuideline}
          confidence={pending.confidence}
          correcting={correcting}
          busy={resolving}
          onConfirmYes={() =>
            void resolve({
              detectedRaw: pending.rawMood,
              predictedGuideline: pending.predictedGuideline,
              confirmedMood: pending.predictedGuideline,
              confidence: pending.confidence,
              moodWasCorrect: true,
              moodSource: "camera",
              imageBase64: pending.imageBase64,
              moodBackend: pending.moodBackend,
            })
          }
          onConfirmNo={() => setCorrecting(true)}
          onCancelCorrection={() => setCorrecting(false)}
          onSelectCorrection={(mood) =>
            void resolve({
              detectedRaw: pending.rawMood,
              predictedGuideline: pending.predictedGuideline,
              confirmedMood: mood,
              confidence: pending.confidence,
              moodWasCorrect: false,
              moodSource: "camera",
              imageBase64: pending.imageBase64,
              moodBackend: pending.moodBackend,
            })
          }
        />
      )}

      {inExperiment && !pending && !guidelines && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-sm font-semibold text-neutral-900">
            Camera not working?
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Choose how you feel right now — this is only a backup if the camera
            cannot run. Your choice is used directly (no model prediction).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GUIDELINE_MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                disabled={resolving}
                onClick={() =>
                  void resolve({
                    detectedRaw: null,
                    predictedGuideline: null,
                    confirmedMood: mood,
                    confidence: null,
                    moodWasCorrect: null,
                    moodSource: "manual",
                  })
                }
                className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      )}

      {resolving && (
        <p className="text-sm text-neutral-600">Personalizing your shop…</p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {inExperiment && guidelines && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-neutral-900">
            Your shop is ready
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            We personalized the shopping experience for this session. Continue
            to browse products — you can shop, add to cart, and checkout as
            usual.
          </p>
          {saved && (
            <p className="mt-2 text-xs text-emerald-700">
              Session saved. Thank you for participating.
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link
              href="/?experiment=adapted"
              className="inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Continue to shop
            </Link>
            <Link
              href="/shop?experiment=adapted"
              className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900"
            >
              Browse products
            </Link>
          </div>

          {searchParams.get("debugAdaptive") === "1" && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-xs font-medium text-neutral-500">
                Debug: adaptation details
              </summary>
              <div className="mt-2 space-y-2 text-xs text-neutral-600">
                <p>
                  Mood: {detectedMood} → {guidelines.mood} · Device:{" "}
                  {guidelines.device} · Persona: {surveyPersona ?? "—"}
                </p>
                <p>Pipeline: {guidelines.pipeline.join(" → ")}</p>
                {generatedUiStatus === "error" && generatedUiError && (
                  <p className="text-amber-700">LLM: {generatedUiError}</p>
                )}
                {uiConfig?.log && (
                  <pre className="max-h-40 overflow-auto rounded-lg bg-neutral-50 p-2">
                    {JSON.stringify(uiConfig.log, null, 2)}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
