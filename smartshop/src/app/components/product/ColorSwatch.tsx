// components/product/ColorSwatch.tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ColorSwatch({ colors }: { colors: string[] }) {
  const [active, setActive] = useState(colors[0]);
  return (
    <div className="flex gap-2">
      {colors.map((c) => (
        <button
          key={c}
          title={c}
          onClick={() => setActive(c)}
          className={cn(
            "h-8 w-8 rounded-full ring-1 ring-inset ring-black/10",
            active === c && "outline outline-2 outline-neutral-900"
          )}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}
