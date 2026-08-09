"use client";

import Link from "next/link";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";

/**
 * Shows active Adaptive Engine decisions for the session.
 * Helpful for demos / thesis walkthrough; always on during adapted experiment.
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

  const ff = uiConfig.factorFallbacks;
  const moodFb = ff?.mood ?? uiConfig.moodFallback ?? null;
  const deviceFb = ff?.device ?? null;
  const personaFb = ff?.persona ?? null;

  const moodNote = moodFb
    ? moodFb.requested &&
      moodFb.requested.toLowerCase() !== moodFb.used.toLowerCase()
      ? `${moodFb.requested} → ${moodFb.used}`
      : `using ${moodFb.used}`
    : null;
  const deviceNote = deviceFb
    ? `${deviceFb.requested ?? "?"} → ${deviceFb.used}`
    : null;
  const personaNote = personaFb
    ? `${personaFb.requested ?? "(none)"} → ${personaFb.used}`
    : null;

  const globalFillNote = uiConfig.globalFill?.keys?.length
    ? `Filled ${uiConfig.globalFill.keys.length} missing token(s) from global defaults`
    : null;
  const activeNudges = Object.entries(uiConfig.nudges ?? {}).filter(
    ([, n]) => typeof n === "number" && n !== 0
  );
  const nudgeNote =
    activeNudges.length > 0
      ? activeNudges
          .map(([k, n]) => `${k}:${(n as number) > 0 ? "+" : ""}${n}`)
          .join(" · ")
      : null;

  const formLabel =
    (uiConfig.tokens.form_field_style?.value ?? v.formFields)
      .split("(")[0]
      ?.trim()
      .replace(/_/g, " ") || v.formFields.replace(/_/g, " ");
  const checkoutLabel =
    (uiConfig.tokens.checkout_style?.value ?? v.checkout)
      .split("(")[0]
      ?.trim()
      .replace(/_/g, " ") || v.checkout.replace(/_/g, " ");

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
            Nav: <strong>{v.navigation.replace(/_/g, " ")}</strong>
            {" · "}
            Theme: <strong>{v.colorTheme.replace(/_/g, " ")}</strong>
            {" · "}
            Accent: <strong>{v.accentColor.replace(/_/g, " ")}</strong>
            {" · "}
            Background: <strong>{v.background.replace(/_/g, " ")}</strong>
            {" · "}
            Grid: <strong>{v.grid.replace(/_/g, " ")}</strong>
            {" · "}
            Cards: <strong>{v.productCard.replace(/_/g, " ")}</strong>
            {" · "}
            Reviews: <strong>{v.reviewDisplay.replace(/_/g, " ")}</strong>
            {" · "}
            Social proof:{" "}
            <strong>{v.socialProofDisplay.replace(/_/g, " ")}</strong>
            {" · "}
            Proof influence:{" "}
            <strong>{v.socialProofInfluence.replace(/_/g, " ")}</strong>
            {" · "}
            Whitespace: <strong>{v.whitespace.replace(/_/g, " ")}</strong>
            {" · "}
            Price: <strong>{v.priceDisplay.replace(/_/g, " ")}</strong>
            {" · "}
            Forms: <strong>{formLabel}</strong>
            {" · "}
            Checkout: <strong>{checkoutLabel}</strong>
            {" · "}
            Search: <strong>{v.search.replace(/_/g, " ")}</strong>
            {" · "}
            Hero: <strong>{v.heroBanner.replace(/_/g, " ")}</strong>
            {" · "}
            Urgency: <strong>{v.urgency.replace(/_/g, " ")}</strong>
            {" · "}
            Quick view: <strong>{v.quickView.replace(/_/g, " ")}</strong>
            {" · "}
            Categories: <strong>{v.categories.replace(/_/g, " ")}</strong>
            {" · "}
            Filters: <strong>{v.filters.replace(/_/g, " ")}</strong>
            {" · "}
            Persistent filters:{" "}
            <strong>{v.persistentFilters.replace(/_/g, " ")}</strong>
          </p>
          {moodNote && (
            <p className="mt-1.5 inline-flex items-center rounded-md bg-amber-100/90 px-2 py-1 text-xs font-medium text-amber-950">
              Mood fallback: {moodNote}
            </p>
          )}
          {deviceNote && (
            <p className="mt-1.5 inline-flex items-center rounded-md bg-orange-100/90 px-2 py-1 text-xs font-medium text-orange-950">
              Device fallback: {deviceNote}
            </p>
          )}
          {personaNote && (
            <p className="mt-1.5 inline-flex items-center rounded-md bg-rose-100/90 px-2 py-1 text-xs font-medium text-rose-950">
              Persona fallback: {personaNote}
            </p>
          )}
          {globalFillNote && (
            <p className="mt-1.5 inline-flex items-center rounded-md bg-sky-100/90 px-2 py-1 text-xs font-medium text-sky-950">
              Global fill: {globalFillNote}
            </p>
          )}
          {nudgeNote && (
            <p className="mt-1.5 inline-flex items-center rounded-md bg-violet-100/90 px-2 py-1 text-xs font-medium text-violet-950">
              Trait nudges: {nudgeNote}
            </p>
          )}
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
