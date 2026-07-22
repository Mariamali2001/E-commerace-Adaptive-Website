"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WebcamCapture } from "@/components/mood/WebcamCapture";
import { useExperimentStore } from "@/store/experiment";
import { detectDeviceClient } from "@/lib/guidelines/device";
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
  const guidelines = useExperimentStore((s) => s.guidelines);
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

        const res = await fetch("/api/guidelines/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device,
            persona,
            traits,
            detectedMood: mood,
          }),
        });
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || "Guidelines resolve failed");
        }
        const resolved = payload.data as ResolvedGuidelines;
        setGuidelines(resolved);

        const uiElements: Record<string, string> = {};
        for (const [key, tok] of Object.entries(resolved.tokens)) {
          uiElements[key] = tok.value;
        }

        const saveRes = await fetch("/api/experiment/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            device,
            answers,
            age: answers.age ? Number(answers.age) : null,
            gender: answers.gender ?? null,
            surveyPersona,
            guidelinePersona: resolved.persona,
            traitScores,
            traitLevels: traits,
            selfReportedMood,
            detectedMood: mood,
            detectedConfidence: confidence,
            guidelineMood: resolved.mood,
            uiElements,
            guidelinesPipeline: resolved.pipeline,
          }),
        });
        const savePayload = await saveRes.json();
        if (!saveRes.ok) {
          throw new Error(savePayload.error || "Could not save experiment data");
        }
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Guidelines resolve failed");
      } finally {
        setResolving(false);
      }
    },
    [
      answers,
      inExperiment,
      persona,
      selfReportedMood,
      setDevice,
      setGuidelines,
      setMood,
      surveyPersona,
      traitScores,
      traits,
    ]
  );

  return (
    <div className="space-y-6">
      {inExperiment && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Experiment step: detect your mood. We will resolve UI guidelines from
          device + questionnaire + mood, then save your data for the admin export.
        </div>
      )}

      <WebcamCapture
        onMoodDetected={({ mood, confidence }) => {
          if (inExperiment) void resolve(mood, confidence);
        }}
      />

      {resolving && (
        <p className="text-sm text-neutral-600">Resolving guidelines & saving…</p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {inExperiment && guidelines && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-neutral-900">
            Guidelines ready
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
            Device: {guidelines.device} · Survey persona:{" "}
            {surveyPersona ?? "—"} · Guideline persona:{" "}
            {guidelines.persona ?? "—"}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Pipeline: {guidelines.pipeline.join(" → ")}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-neutral-800">
              Preview tokens ({Object.keys(guidelines.tokens).length})
            </summary>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-neutral-600">
              {Object.entries(guidelines.tokens)
                .slice(0, 20)
                .map(([key, tok]) => (
                  <li key={key}>
                    <span className="font-medium">{key}</span>: {tok.value}{" "}
                    <span className="text-neutral-400">({tok.source})</span>
                  </li>
                ))}
            </ul>
          </details>
          <Link
            href="/shop?experiment=adapted"
            className="mt-4 inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Continue to shop
          </Link>
        </div>
      )}
    </div>
  );
}
