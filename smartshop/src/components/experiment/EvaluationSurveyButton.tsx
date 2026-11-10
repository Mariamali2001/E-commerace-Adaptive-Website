"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useExperimentStore } from "@/store/experiment";

const TALLY_SCRIPT = "https://tally.so/widgets/embed.js";
const TALLY_FORM_ID =
  process.env.NEXT_PUBLIC_TALLY_FORM_ID?.trim() || "ZjAe9v";

function loadTallyScript() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[src="${TALLY_SCRIPT}"]`)) return;
  const script = document.createElement("script");
  script.src = TALLY_SCRIPT;
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Corner control: opens the post-experiment Tally form on click only.
 * Does not auto-open or overlay the adapted shop.
 */
export function EvaluationSurveyButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const phase = useExperimentStore((s) => s.phase);

  const hideOn =
    pathname?.startsWith("/shop/experiment") ||
    pathname?.startsWith("/shop/mood") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/shop/auth") ||
    pathname?.startsWith("/admin");

  const adaptedQuery = searchParams.get("experiment") === "adapted";
  const visible = !hideOn && (phase === "guidelines_ready" || adaptedQuery);

  useEffect(() => {
    if (visible) loadTallyScript();
  }, [visible]);

  if (!visible) return null;

  return (
    <button
      type="button"
      data-tally-open={TALLY_FORM_ID}
      className="fixed bottom-20 right-4 z-40 max-w-[calc(100%-2rem)] rounded-full border border-neutral-200 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white md:bottom-4"
    >
      Evaluation survey
    </button>
  );
}
