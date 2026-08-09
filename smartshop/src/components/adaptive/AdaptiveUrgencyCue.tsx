"use client";

import { useEffect, useState } from "react";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import {
  formatCountdown,
  parseUrgencyMode,
  stockLeftFromId,
  urgencyDeadlineMs,
} from "@/lib/uiAdapter/urgency";
import { cn } from "@/lib/utils";

/**
 * Product-level urgency: stock left and/or deal countdown.
 * Shown only when Adaptive Engine urgency_pref enables it.
 */
export function AdaptiveUrgencyCue({
  productId,
  className,
  compact = false,
}: {
  productId: string;
  className?: string;
  compact?: boolean;
}) {
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

  const left = stockLeftFromId(productId);

  return (
    <div
      className={cn(
        "adaptive-urgency-cue space-y-0.5 font-semibold text-red-600",
        compact ? "text-[10px]" : "text-xs",
        className
      )}
      data-urgency-cue={urgency}
    >
      {showStock && <p>Only {left} left</p>}
      {showCountdown && <p>Ends in {formatCountdown(msLeft)}</p>}
    </div>
  );
}
