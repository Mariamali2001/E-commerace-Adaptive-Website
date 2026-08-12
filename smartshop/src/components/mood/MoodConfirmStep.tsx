"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GUIDELINE_MOODS, type GuidelineMood } from "@/lib/guidelines/types";
import { Button } from "@/components/shared/Button";

type MoodConfirmStepProps = {
  predictedGuideline: GuidelineMood | string;
  confidence: number | null;
  correcting: boolean;
  busy?: boolean;
  onConfirmYes: () => void;
  onConfirmNo: () => void;
  onSelectCorrection: (mood: GuidelineMood) => void;
  onCancelCorrection?: () => void;
};

export function MoodConfirmStep({
  predictedGuideline,
  confidence,
  correcting,
  busy,
  onConfirmYes,
  onConfirmNo,
  onSelectCorrection,
  onCancelCorrection,
}: MoodConfirmStepProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || busy) return;
      if (correcting && onCancelCorrection) onCancelCorrection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, correcting, onCancelCorrection]);

  if (!mounted) return null;

  const panel = correcting ? (
    <div className="space-y-4">
      <div>
        <h2
          id="mood-confirm-title"
          className="text-lg font-semibold text-neutral-900"
        >
          What is your mood right now?
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          We detected <span className="font-medium">{predictedGuideline}</span>
          {confidence != null && (
            <span className="text-neutral-500">
              {" "}
              ({(confidence * 100).toFixed(0)}%)
            </span>
          )}
          . Please choose the correct mood — this personalizes your shop.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {GUIDELINE_MOODS.map((mood) => (
          <button
            key={mood}
            type="button"
            disabled={busy}
            onClick={() => onSelectCorrection(mood)}
            className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
          >
            {mood}
          </button>
        ))}
      </div>
      {onCancelCorrection && (
        <button
          type="button"
          disabled={busy}
          onClick={onCancelCorrection}
          className="text-xs text-neutral-500 underline hover:text-neutral-800 disabled:opacity-50"
        >
          Back
        </button>
      )}
    </div>
  ) : (
    <div className="space-y-4">
      <div>
        <h2
          id="mood-confirm-title"
          className="text-lg font-semibold text-neutral-900"
        >
          Is this your mood?
        </h2>
        <p className="mt-2 text-base text-neutral-800">
          We detected{" "}
          <span className="font-semibold">{predictedGuideline}</span>
          {confidence != null && (
            <span className="text-neutral-600">
              {" "}
              ({(confidence * 100).toFixed(0)}% confidence)
            </span>
          )}
          .
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Please confirm so we personalize the shop correctly.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={busy}
          onClick={onConfirmYes}
          className="bg-emerald-700 hover:opacity-90"
        >
          Yes, that&apos;s right
        </Button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirmNo}
          className="btn rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          No, fix it
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mood-confirm-title"
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        {panel}
        {busy && (
          <p className="mt-4 text-center text-xs text-neutral-500">
            Personalizing your shop…
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
