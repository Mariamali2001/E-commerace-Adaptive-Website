import type { DeviceKind } from "./types";

/**
 * Experiment device class for guidelines.
 * Uses the larger of screen width and viewport so a narrowed desktop
 * browser window is still counted as desktop.
 */
export function detectDeviceFromWidth(width: number): DeviceKind {
  return width < 768 ? "mobile" : "desktop";
}

export function detectDeviceClient(): DeviceKind {
  if (typeof window === "undefined") return "desktop";
  const screenW = window.screen?.width ?? 0;
  const viewW = window.innerWidth ?? 0;
  const w = Math.max(screenW, viewW);
  // Phones are typically <= 500 CSS px wide on the physical screen axis we care about
  return w < 600 ? "mobile" : "desktop";
}
