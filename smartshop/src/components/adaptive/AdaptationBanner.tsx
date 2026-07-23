"use client";

import Link from "next/link";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";

/**
 * Only for logged-in experiment sessions.
 * Persona = questionnaire. Mood = model detection.
 */
export function AdaptationBanner() {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const surveyPersona = useExperimentStore((s) => s.surveyPersona);
  const detectedMood = useExperimentStore((s) => s.detectedMood);

  if (!ready || !allowed || !uiConfig) return null;

  const v = resolveVariants(uiConfig);
  const moodLabel = detectedMood ?? uiConfig.detectedMood ?? "—";
  const personaLabel = surveyPersona ?? "—";

  return (
    <div className="adaptation-banner border-b px-4 py-3 text-sm">
      <div className="container flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Adaptive UI active</p>
          <p className="text-xs opacity-90">
            Mood (detected): <strong className="capitalize">{moodLabel}</strong>
            {" · "}
            Persona (questionnaire): <strong>{personaLabel}</strong>
            {" · "}
            Theme: <strong>{v.colorTheme.replace(/_/g, " ")}</strong>
            {" · "}
            Grid: <strong>{v.grid.replace(/_/g, " ")}</strong>
            {" · "}
            Cards: <strong>{v.productCard.replace(/_/g, " ")}</strong>
            {" · "}
            Hero: <strong>{v.heroBanner.replace(/_/g, " ")}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-900"
          >
            Home
          </Link>
          <Link
            href="/shop?experiment=adapted"
            className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-900"
          >
            Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
