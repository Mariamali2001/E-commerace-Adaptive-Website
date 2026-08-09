"use client";

import { useEffect, useState } from "react";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import {
  formatCountdown,
  parseUrgencyMode,
  urgencyDeadlineMs,
} from "@/lib/uiAdapter/urgency";

/**
 * Page-level urgency strip driven by urgency_pref.
 * Replaces the old CSS ::before fake message with real stock / countdown copy.
 */
export function AdaptiveUrgencyBanner() {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const [msLeft, setMsLeft] = useState(() =>
    Math.max(0, urgencyDeadlineMs() - Date.now())
  );

  const adapted = ready && allowed && uiConfig;
  const urgency = adapted ? resolveVariants(uiConfig).urgency : "";
  const { showStock, showCountdown } = parseUrgencyMode(urgency);

  useEffect(() => {
    if (!showCountdown) return;
    const tick = () =>
      setMsLeft(Math.max(0, urgencyDeadlineMs() - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [showCountdown]);

  if (!adapted || (!showStock && !showCountdown)) return null;

  const parts: string[] = [];
  if (showStock) parts.push("Limited stock on popular items");
  if (showCountdown) parts.push(`Sale ends in ${formatCountdown(msLeft)}`);

  return (
    <div
      className="adaptive-urgency-banner border-b px-4 py-2 text-center text-xs font-bold tracking-wide"
      data-urgency-banner={urgency}
      role="status"
    >
      {parts.join(" · ")}
    </div>
  );
}
