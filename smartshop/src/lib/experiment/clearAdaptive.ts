import { useExperimentStore } from "@/store/experiment";

export const EXPERIMENT_STORAGE_KEY = "smartshop-experiment-v5";

/** Older keys that must not resurrect adaptive UI after logout */
const LEGACY_KEYS = [
  "smartshop-experiment-v3",
  "smartshop-experiment-v4",
  "smartshop-experiment-v5",
];

function stripAdaptiveDom() {
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
