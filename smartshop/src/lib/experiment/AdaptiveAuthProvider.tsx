"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearAdaptiveExperiment } from "@/lib/experiment/clearAdaptive";
import { useExperimentStore } from "@/store/experiment";

type AdaptiveAuthValue = {
  ready: boolean;
  allowed: boolean;
};

const AdaptiveAuthContext = createContext<AdaptiveAuthValue>({
  ready: false,
  allowed: false,
});

/**
 * One auth check for the whole app — avoids shop page waiting seconds
 * while every component refetches /api/auth/me.
 */
export function AdaptiveAuthProvider({ children }: { children: ReactNode }) {
  const uiConfig = useExperimentStore((s) => s.uiConfig);
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

  // Optimistic: if Final UI Config already in this session, apply immediately
  // (then auth confirms). Fixes shop lag vs home after mood.
  const value = useMemo(() => {
    const optimistic = Boolean(uiConfig) && !ready;
    return {
      ready: ready || optimistic,
      allowed: allowed || optimistic,
    };
  }, [ready, allowed, uiConfig]);

  return (
    <AdaptiveAuthContext.Provider value={value}>
      {children}
    </AdaptiveAuthContext.Provider>
  );
}

export function useAdaptiveAllowed(): AdaptiveAuthValue {
  return useContext(AdaptiveAuthContext);
}
