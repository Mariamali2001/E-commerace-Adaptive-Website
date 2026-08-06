"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearAdaptiveExperiment } from "@/lib/experiment/clearAdaptive";
import { useExperimentStore } from "@/store/experiment";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AdaptiveAuthValue = {
  ready: boolean;
  allowed: boolean;
  /** From the single shared /api/auth/me fetch (null when logged out). */
  user: AuthUser | null;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
};

const AdaptiveAuthContext = createContext<AdaptiveAuthValue>({
  ready: false,
  allowed: false,
  user: null,
  refreshUser: async () => {},
  clearUser: () => {},
});

/**
 * One auth check for the whole app — layout chrome reuses this instead of
 * refetching /api/auth/me (UserMenu / MobileNav).
 *
 * Hydration-safe: first client render matches SSR (ready/allowed false)
 * until after mount, so persisted session UI config cannot mismatch HTML.
 */
export function AdaptiveAuthProvider({ children }: { children: ReactNode }) {
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        clearAdaptiveExperiment();
        setAllowed(false);
        setUser(null);
        return;
      }
      const payload = await res.json();
      const nextUser = (payload?.data as AuthUser | null) ?? null;
      setUser(nextUser);
      // Preserve prior gate: successful /me response unlocks adaptive shell
      setAllowed(true);
    } catch {
      clearAdaptiveExperiment();
      setAllowed(false);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          clearAdaptiveExperiment();
          setAllowed(false);
          setUser(null);
        } else {
          const payload = await res.json();
          if (cancelled) return;
          setUser((payload?.data as AuthUser | null) ?? null);
          setAllowed(true);
        }
      } catch {
        if (!cancelled) {
          clearAdaptiveExperiment();
          setAllowed(false);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(() => {
    if (!mounted) {
      return {
        ready: false,
        allowed: false,
        user: null,
        refreshUser: loadMe,
        clearUser,
      };
    }
    const optimistic = Boolean(uiConfig) && !ready;
    return {
      ready: ready || optimistic,
      allowed: allowed || optimistic,
      user,
      refreshUser: loadMe,
      clearUser,
    };
  }, [mounted, ready, allowed, uiConfig, user, loadMe, clearUser]);

  return (
    <AdaptiveAuthContext.Provider value={value}>
      {children}
    </AdaptiveAuthContext.Provider>
  );
}

export function useAdaptiveAllowed(): Pick<
  AdaptiveAuthValue,
  "ready" | "allowed"
> {
  const { ready, allowed } = useContext(AdaptiveAuthContext);
  return { ready, allowed };
}

/** Shared session for header chrome — no extra /api/auth/me. */
export function useAuthSession(): AdaptiveAuthValue {
  return useContext(AdaptiveAuthContext);
}
