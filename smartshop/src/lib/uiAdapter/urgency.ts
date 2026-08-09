/** Parse Adaptive Engine urgency_pref variant into concrete UI flags. */
export function parseUrgencyMode(urgency: string | undefined): {
  showStock: boolean;
  showCountdown: boolean;
} {
  const id = (urgency ?? "").toLowerCase();
  if (
    !id ||
    id.includes("none") ||
    id.includes("annoying") ||
    id.includes("manipulative") ||
    id.includes("no_urgency") ||
    id.includes("hide")
  ) {
    return { showStock: false, showCountdown: false };
  }
  if (id.includes("both")) {
    return { showStock: true, showCountdown: true };
  }
  if (id.includes("stock") || id.includes("inventory") || id.includes("left")) {
    return { showStock: true, showCountdown: false };
  }
  if (
    id.includes("countdown") ||
    id.includes("time") ||
    id.includes("timer") ||
    id.includes("deal_ends")
  ) {
    return { showStock: false, showCountdown: true };
  }
  return { showStock: false, showCountdown: false };
}

/** Stable faux inventory from product id (research prototype, not real stock). */
export function stockLeftFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 2 + (h % 8); // 2–9
}

/** End of local calendar day — stable countdown target for the session day. */
export function urgencyDeadlineMs(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function formatCountdown(msLeft: number): string {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
