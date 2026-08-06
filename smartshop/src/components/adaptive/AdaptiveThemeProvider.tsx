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
    "data-background",
    "data-accent",
    "data-grid",
    "data-urgency",
    "data-hero",
    "data-product-card",
    "data-nav",
    "data-price",
    "data-mood",
    "data-checkout",
    "data-review",
    "data-form-fields",
    "data-whitespace",
    "data-font-style",
    "data-font-size",
    "data-button-style",
    "data-search",
    "data-filters",
    "data-product-desc",
    "data-image-text",
    "data-info-density",
    "data-touch",
    "data-sticky-header",
    "data-recommendation",
    "data-quick-view",
    "data-categories",
    "data-persistent-filters",
  ].forEach((attr) => root.removeAttribute(attr));
  root.style.removeProperty("--adaptive-density");
  root.style.removeProperty("--adaptive-visual-richness");
  root.style.removeProperty("--adaptive-social-proof");
  root.style.removeProperty("--adaptive-recommendation");
  root.style.removeProperty("--adaptive-gap");
  root.removeAttribute("data-nudge-density");
  root.removeAttribute("data-nudge-visual");
  root.removeAttribute("data-nudge-social");
  document.body.classList.remove("adaptive-active");
}

/**
 * Theme only when logged in + Final UI Configuration exists.
 * Mood attribute drives stronger visual differences when theme tokens collide.
 */
export function AdaptiveThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const detectedMood = useExperimentStore((s) => s.detectedMood);
  const active = ready && allowed && uiConfig;

  useEffect(() => {
    if (!active || !uiConfig) {
      stripAdaptiveDomOnly();
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const v = resolveVariants(uiConfig);
    const mood = (
      detectedMood ??
      uiConfig.detectedMood ??
      uiConfig.mood ??
      "neutral"
    )
      .toString()
      .toLowerCase();

    root.setAttribute("data-adaptive", "1");
    // Guideline theme/background drive surfaces (not invented mood palettes)
    root.setAttribute("data-theme", v.colorTheme);
    root.setAttribute("data-background", v.background);
    root.setAttribute("data-accent", v.accentColor);
    root.setAttribute("data-grid", v.grid);
    root.setAttribute("data-urgency", v.urgency);
    root.setAttribute("data-hero", v.heroBanner);
    root.setAttribute("data-product-card", v.productCard);
    root.setAttribute("data-nav", v.navigation);
    root.setAttribute("data-price", v.priceDisplay);
    root.setAttribute("data-checkout", v.checkout);
    root.setAttribute("data-review", v.reviewDisplay);
    root.setAttribute("data-form-fields", v.formFields);
    root.setAttribute("data-whitespace", v.whitespace);
    root.setAttribute("data-font-style", v.fontStyle);
    root.setAttribute("data-font-size", v.fontSize);
    root.setAttribute("data-button-style", v.buttonStyle);
    root.setAttribute("data-search", v.search);
    root.setAttribute("data-filters", v.filters);
    root.setAttribute("data-product-desc", v.productDesc);
    root.setAttribute("data-image-text", v.imageText);
    root.setAttribute("data-info-density", v.infoDensity);
    root.setAttribute("data-touch", v.touchSize);
    root.setAttribute("data-sticky-header", v.stickyHeader);
    root.setAttribute("data-recommendation", v.recommendation);
    root.setAttribute("data-quick-view", v.quickView);
    root.setAttribute("data-categories", v.categories);
    root.setAttribute("data-persistent-filters", v.persistentFilters);
    root.setAttribute("data-mood", mood);
    root.style.setProperty(
      "--adaptive-density",
      String(v.nudges.information_density)
    );
    root.style.setProperty(
      "--adaptive-visual-richness",
      String(v.nudges.visual_richness)
    );
    root.style.setProperty(
      "--adaptive-social-proof",
      String(v.nudges.social_proof)
    );
    root.style.setProperty(
      "--adaptive-recommendation",
      String(v.nudges.recommendation_strength)
    );
    root.setAttribute(
      "data-nudge-density",
      v.nudges.information_density > 0
        ? "high"
        : v.nudges.information_density < 0
          ? "low"
          : "mid"
    );
    root.setAttribute(
      "data-nudge-visual",
      v.nudges.visual_richness > 0
        ? "high"
        : v.nudges.visual_richness < 0
          ? "low"
          : "mid"
    );
    root.setAttribute(
      "data-nudge-social",
      v.nudges.social_proof > 0
        ? "high"
        : v.nudges.social_proof < 0
          ? "low"
          : "mid"
    );
    // Higher information_density → more breathing room between blocks
    const gap =
      v.nudges.information_density > 0
        ? "2.25rem"
        : v.nudges.information_density < 0
          ? "0.85rem"
          : "1.5rem";
    root.style.setProperty("--adaptive-gap", gap);
    body.classList.add("adaptive-active");
  }, [active, uiConfig, detectedMood]);

  return <>{children}</>;
}
