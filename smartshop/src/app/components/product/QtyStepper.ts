// components/product/QtyStepper.tsx
"use client";
import { useState } from "react";

export function QtyStepper() {
  const [q, setQ] = useState(1);
  return (
    <div className="inline-flex items-center gap-4 rounded-xl border border-neutral-200 px-3 py-2">
      <button onClick={() => setQ((n) => Math.max(1, n - 1))} aria-label="Decrease">−</button>
      <span className="min-w-[1.5ch] text-center">{q}</span>
      <button onClick={() => setQ((n) => n + 1)} aria-label="Increase">+</button>
    </div>
  );
}
