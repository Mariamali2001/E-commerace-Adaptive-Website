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
          age: answers.age ? Number(answers.age) : auth?.age ?? null,
          gender: answers.gender ?? auth?.gender ?? null,
          name: auth?.name ?? null,
          email: auth?.email ?? null,
          answers,
          phase: "mood",
          language: "en",
        });
        setContext(ctx);

        // 2) Adaptive Engine — Context → Final UI Configuration
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
        const resolved = (payload.guidelines ?? configuration) as ResolvedGuidelines;
        if (payload.context) setContext(payload.context as ContextObject);
        setUiConfig(configuration);
        setGuidelines(resolved);

        const uiElements: Record<string, string> = {};
        for (const [key, tok] of Object.entries(configuration.tokens)) {
          uiElements[key] = tok.value;
        }

        // 3) Persist experiment
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
            age: ctx.user.age,
            gender: ctx.user.gender,
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
      surveyPersona,
      traitScores,
      traits,
    ]
  );

  return (
    <div className="space-y-6">
      {inExperiment && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Flow: <strong>Context Builder</strong> →{" "}
          <strong>Adaptive Engine</strong> → save. UI Adapter comes next.
        </div>
      )}

      <WebcamCapture
        onMoodDetected={({ mood, confidence }) => {
          if (inExperiment) void resolve(mood, confidence);
        }}
      />

      {resolving && (
        <p className="text-sm text-neutral-600">
          Building context, running Adaptive Engine & saving…
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {inExperiment && guidelines && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-neutral-900">
            Final UI Configuration ready
          </h2>
          {saved && (
            <p className="mt-1 text-sm text-emerald-700">
              Experiment data saved for admin Excel export.
            </p>
          )}
          <p className="mt-1 text-sm text-neutral-600">
            Detected mood:{" "}
            <span className="font-medium capitalize">{detectedMood}</span>
            {" → "}
            guideline mood:{" "}
            <span className="font-medium">{guidelines.mood}</span>
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Device: {guidelines.device} · Persona (questionnaire):{" "}
            {surveyPersona ?? "—"}
            {guidelines.persona && guidelines.persona !== surveyPersona ? (
              <span className="text-neutral-400">
                {" "}
                (engine key: {guidelines.persona})
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Pipeline: {guidelines.pipeline.join(" → ")}
          </p>

          {context && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-neutral-800">
                Context Object
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-neutral-50 p-3 text-[11px] text-neutral-700">
                {JSON.stringify(context, null, 2)}
              </pre>
            </details>
          )}

          {uiConfig?.log && (
            <details className="mt-3" open>
              <summary className="cursor-pointer text-sm font-medium text-neutral-800">
                Adaptation log ({uiConfig.log.length} steps)
              </summary>
              <ul className="mt-2 max-h-48 space-y-1.5 overflow-auto text-xs text-neutral-700">
                {uiConfig.log.map((entry, i) => (
                  <li key={`${entry.step}-${i}`} className="rounded-lg bg-neutral-50 px-2 py-1.5">
                    <span className="font-medium text-neutral-900">
                      {entry.step}
                    </span>
                    {entry.id ? (
                      <span className="text-neutral-500"> · {entry.id}</span>
                    ) : null}
                    <div className="text-neutral-600">{entry.message}</div>
                    {entry.keysOverridden?.length ? (
                      <div className="text-neutral-400">
                        keys: {entry.keysOverridden.join(", ")}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-neutral-800">
              Categorical tokens ({Object.keys(guidelines.tokens).length})
            </summary>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-neutral-600">
              {Object.entries(guidelines.tokens)
                .slice(0, 24)
                .map(([key, tok]) => (
                  <li key={key}>
                    <span className="font-medium">{key}</span>: {tok.value}{" "}
                    <span className="text-neutral-400">({tok.source})</span>
                  </li>
                ))}
            </ul>
          </details>

          {uiConfig && Object.keys(uiConfig.nudges).length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-neutral-800">
                Trait nudges ({Object.keys(uiConfig.nudges).length})
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                {Object.entries(uiConfig.nudges).map(([key, delta]) => (
                  <li key={key}>
                    <span className="font-medium">{key}</span>:{" "}
                    {delta > 0 ? `+${delta}` : delta}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/?experiment=adapted"
              className="inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              See adapted home
            </Link>
            <Link
              href="/shop?experiment=adapted"
              className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900"
            >
              See adapted shop
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
