"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WebcamCapture } from "@/components/mood/WebcamCapture";
import { useExperimentStore } from "@/store/experiment";
import { detectDeviceClient } from "@/lib/guidelines/device";
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
  const generatedBundle = useExperimentStore((s) => s.generatedBundle);
  const guidelines = useExperimentStore((s) => s.guidelines);
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const context = useExperimentStore((s) => s.context);
  const detectedMood = useExperimentStore((s) => s.detectedMood);

  const [resolving, setResolving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(
    async (mood: string, confidence: number | null) => {
      if (!inExperiment) return;
      setMood(mood, confidence);
      setResolving(true);
      setSaved(false);
      setError(null);
      try {
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

        // 1) Context Builder
        const ctx: ContextObject = buildContext({
          userId: auth?.id ?? null,
          participantId: auth?.id ?? null,
          device,
          persona,
          surveyPersona,
          selfReportedMood,
          detectedMood: mood,
          detectedConfidence: confidence,
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
            detectedMood: ctx.mood.detected,
            detectedConfidence: ctx.mood.confidence,
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

  return (
    <div className="space-y-6">
      {inExperiment && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          Step: look at the camera (or pick a mood below if the camera is
          unavailable). We will prepare your personalized shop next.
        </div>
      )}

      <WebcamCapture
        onMoodDetected={({ mood, confidence }) => {
          if (inExperiment) void resolve(mood, confidence);
        }}
      />

      {inExperiment && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-sm font-semibold text-neutral-900">
            Camera not working?
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Choose how you feel right now — this is only a backup if the camera
            cannot run.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Happy",
              "Neutral",
              "Sad",
              "Stressed",
              "Excited",
              "Bored",
              "Relaxed",
              "Frustrated",
            ].map((mood) => (
              <button
                key={mood}
                type="button"
                disabled={resolving}
                onClick={() => void resolve(mood, null)}
                className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      )}

      {resolving && (
        <p className="text-sm text-neutral-600">
          Personalizing your shop…
        </p>
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

          {/* Researcher/debug only — collapsed, not shown open to participants */}
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
