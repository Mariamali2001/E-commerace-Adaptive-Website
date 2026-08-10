"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  remainingBrowseMs,
  useExperimentStore,
} from "@/store/experiment";
import { detectDeviceClient } from "@/lib/guidelines/device";

function formatMs(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Floating banner during the 3-minute free-browse phase after login. */
export function ExperimentBrowseBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const phase = useExperimentStore((s) => s.phase);
  const browseStartedAt = useExperimentStore((s) => s.browseStartedAt);
  const browseDurationMs = useExperimentStore((s) => s.browseDurationMs);
  const startBrowse = useExperimentStore((s) => s.startBrowse);
  const setDevice = useExperimentStore((s) => s.setDevice);
  const setPhase = useExperimentStore((s) => s.setPhase);

  const [left, setLeft] = useState(() =>
    remainingBrowseMs(browseStartedAt, browseDurationMs)
  );

  // Enter browse mode from login redirect ?experiment=browse
  useEffect(() => {
    if (searchParams.get("experiment") === "browse" && phase === "idle") {
      setDevice(detectDeviceClient());
      startBrowse();
    }
  }, [searchParams, phase, setDevice, startBrowse]);

  useEffect(() => {
    if (phase !== "browse" || !browseStartedAt) return;
    const tick = () => {
      const rem = remainingBrowseMs(browseStartedAt, browseDurationMs);
      setLeft(rem);
      if (rem <= 0) {
        setPhase("questionnaire");
        router.push("/shop/experiment/questionnaire");
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [phase, browseStartedAt, browseDurationMs, router, setPhase]);

  const hideOn =
    pathname?.startsWith("/shop/experiment") ||
    pathname?.startsWith("/shop/mood") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/shop/auth");

  const visible = phase === "browse" && !hideOn;

  const progress = useMemo(() => {
    if (!browseDurationMs) return 0;
    return Math.min(1, 1 - left / browseDurationMs);
  }, [left, browseDurationMs]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(560px,calc(100%-1.5rem))] -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            Free browse time
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Explore the shop naturally. When the timer ends, a few preference
            questions will follow.
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-neutral-900 px-3 py-1 font-mono text-sm text-white">
          {formatMs(left)}
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href="/shop/experiment/questionnaire"
          onClick={() => setPhase("questionnaire")}
          className="text-xs font-medium text-neutral-700 underline underline-offset-2"
        >
          Skip ahead
        </Link>
      </div>
    </div>
  );
}
