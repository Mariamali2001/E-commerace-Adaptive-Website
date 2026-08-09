import { useExperimentStore } from "@/store/experiment";

export const EXPERIMENT_STORAGE_KEY = "smartshop-experiment-v8";

/** Older keys that must not resurrect adaptive UI after logout */
const LEGACY_KEYS = [
  "smartshop-experiment-v3",
  "smartshop-experiment-v4",
  "smartshop-experiment-v5",
  "smartshop-experiment-v6",
  "smartshop-experiment-v7",
  "smartshop-experiment-v8",
];

function stripAdaptiveDom() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  [
    "data-adaptive",
    "data-theme",
    "data-background",
    "data-surface",
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
    "data-social-proof-influence",
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

/** Clear adaptive experiment from memory, storage, and DOM theme attrs. */
export function clearAdaptiveExperiment() {
  useExperimentStore.getState().reset();
  try {
    for (const key of LEGACY_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
  stripAdaptiveDom();
}
