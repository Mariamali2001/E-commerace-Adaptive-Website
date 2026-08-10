"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import {
  EXPERIMENT_QUESTIONS,
  deriveProfileFromAnswers,
} from "@/lib/experiment/questions";
import { detectDeviceClient } from "@/lib/guidelines/device";
import { useExperimentStore } from "@/store/experiment";

const AUTO_ADVANCE_MS = 320;

function CircleProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div
            key={n}
            className={[
              "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition sm:h-9 sm:w-9 sm:text-sm",
              active
                ? "border-neutral-900 bg-neutral-900 text-white ring-4 ring-neutral-900/15"
                : done
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-neutral-200 bg-white text-neutral-400",
            ].join(" ")}
            aria-current={active ? "step" : undefined}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
}

export function ExperimentQuestionnaire() {
  const router = useRouter();
  const setDevice = useExperimentStore((s) => s.setDevice);
  const setProfileFromQuestionnaire = useExperimentStore(
    (s) => s.setProfileFromQuestionnaire
  );
  const savedAnswers = useExperimentStore((s) => s.answers);

  const [consented, setConsented] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [entering, setEntering] = useState(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = EXPERIMENT_QUESTIONS.length;
  const question = EXPERIMENT_QUESTIONS[index];
  const selected = answers[question.id] ?? "";

  const canNext = Boolean(selected);
  const isLast = index === total - 1;

  const title = useMemo(
    () => `Question ${index + 1} of ${total}`,
    [index, total]
  );

  useEffect(() => {
    setEntering(true);
    const t = window.setTimeout(() => setEntering(false), 180);
    return () => window.clearTimeout(t);
  }, [index]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const finishWith = (nextAnswers: Record<string, string>) => {
    const device = detectDeviceClient();
    setDevice(device);
    const profile = deriveProfileFromAnswers(nextAnswers);
    setProfileFromQuestionnaire({
      surveyPersona: profile.surveyPersona,
      persona: profile.persona,
      traits: profile.traits,
      traitScores: profile.traitScores,
      selfReportedMood: profile.selfReportedMood,
      answers: nextAnswers,
    });
    router.push("/shop/mood?experiment=1");
  };

  const goNext = (nextAnswers: Record<string, string>) => {
    if (index >= total - 1) {
      finishWith(nextAnswers);
      return;
    }
    setIndex((i) => i + 1);
  };

  const selectAndAdvance = (value: string) => {
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      goNext(nextAnswers);
    }, AUTO_ADVANCE_MS);
  };

  if (!consented) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Before you continue
          </p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">
            Consent to participate
          </h1>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-600">
            <p>
              You are invited to take part in a short shopping study. Your
              answers help us understand shopping preferences and personalize
              the store experience.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You will answer a few preference questions, then optionally use
                your camera for a brief mood check.
              </li>
              <li>
                Responses and session data may be stored for research analysis.
                Camera frames are processed for mood detection and are not kept
                as a photo gallery.
              </li>
              <li>
                Participation is voluntary. You can stop at any time and continue
                shopping without the study flow.
              </li>
            </ul>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-800">
              I understand the information above and agree to participate.
            </span>
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800"
            >
              No thanks — just shop
            </button>
            <Button
              type="button"
              disabled={!consentChecked}
              onClick={() => setConsented(true)}
            >
              I agree — continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Quick preferences
        </p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {question.kind === "likert5"
            ? "Tap a number (1–5) — we’ll move to the next question automatically."
            : "Tap an option — we’ll move to the next question automatically."}
        </p>

        <div
          key={question.id}
          className={[
            "mt-6 rounded-2xl border border-neutral-100 bg-neutral-50 p-5 transition duration-200",
            entering ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
          ].join(" ")}
        >
          <p className="text-base font-medium text-neutral-900">{question.text}</p>

          {question.kind === "likert5" ? (
            <div className="mt-5">
              <div className="flex justify-between gap-2">
                {question.options.map((opt) => {
                  const active = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectAndAdvance(opt.value)}
                      title={opt.label}
                      className={[
                        "flex h-12 w-12 flex-1 items-center justify-center rounded-full border text-sm font-semibold transition",
                        active
                          ? "scale-105 border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400",
                      ].join(" ")}
                    >
                      {opt.value}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-neutral-500">
                <span>Disagree</span>
                <span>Agree</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {question.options.map((opt) => {
                const active = selected === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectAndAdvance(opt.value)}
                    className={[
                      "w-full rounded-xl border px-4 py-3 text-left text-sm leading-snug transition",
                      active
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => {
              if (advanceTimer.current) clearTimeout(advanceTimer.current);
              setIndex((i) => Math.max(0, i - 1));
            }}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Back
          </button>
          {isLast ? (
            <Button
              type="button"
              disabled={!canNext}
              onClick={() => finishWith(answers)}
            >
              Continue
            </Button>
          ) : (
            <p className="text-xs text-neutral-500">
              Auto-advances after you answer
            </p>
          )}
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-5">
          <p className="mb-3 text-center text-xs text-neutral-500">Progress</p>
          <CircleProgress current={index + 1} total={total} />
        </div>
      </div>
    </div>
  );
}
