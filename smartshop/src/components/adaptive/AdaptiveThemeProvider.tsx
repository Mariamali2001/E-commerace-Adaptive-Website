"use client";

import { useEffect } from "react";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";

function stripAdaptiveDomOnly() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  [
    "data-adaptive",
    "data-theme",
    "data-accent",
    "data-grid",
    "data-urgency",
    "data-hero",
    "data-product-card",
    "data-nav",
    "data-price",
  ].forEach((attr) => root.removeAttribute(attr));
  root.style.removeProperty("--adaptive-density");
  root.style.removeProperty("--adaptive-visual-richness");
  root.style.removeProperty("--adaptive-gap");
  document.body.classList.remove("adaptive-active");
}

/**
 * Theme only when logged in + Final UI Configuration exists.
 * Logged-out visitors get the basic website.
 */
export function AdaptiveThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const active = ready && allowed && uiConfig;

  useEffect(() => {
    if (!active) {
      stripAdaptiveDomOnly();
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const v = resolveVariants(uiConfig);
    root.setAttribute("data-adaptive", "1");
    root.setAttribute("data-theme", v.colorTheme);
    root.setAttribute("data-accent", v.accentColor);
    root.setAttribute("data-grid", v.grid);
    root.setAttribute("data-urgency", v.urgency);
    root.setAttribute("data-hero", v.heroBanner);
    root.setAttribute("data-product-card", v.productCard);
    root.setAttribute("data-nav", v.navigation);
    root.setAttribute("data-price", v.priceDisplay);
    root.style.setProperty(
      "--adaptive-density",
      String(v.nudges.information_density)
    );
    root.style.setProperty(
      "--adaptive-visual-richness",
      String(v.nudges.visual_richness)
    );
    const gap =
      v.nudges.information_density < 0
        ? "1rem"
        : v.nudges.information_density > 0
          ? "2rem"
          : "1.5rem";
    root.style.setProperty("--adaptive-gap", gap);
    body.classList.add("adaptive-active");
  }, [active, uiConfig]);

  return <>{children}</>;
}
