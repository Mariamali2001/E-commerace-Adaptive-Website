"use client";

import { useEffect, useState } from "react";
import { clearAdaptiveExperiment } from "@/lib/experiment/clearAdaptive";

/**
 * Adaptive UI is only allowed for an authenticated experiment session.
 * Logged-out visitors always see the basic website.
 */
export function useAdaptiveAllowed(): {
  ready: boolean;
  allowed: boolean;
} {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          setAllowed(true);
        } else {
          clearAdaptiveExperiment();
          setAllowed(false);
        }
      } catch {
        if (!cancelled) {
          clearAdaptiveExperiment();
          setAllowed(false);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, allowed };
}
