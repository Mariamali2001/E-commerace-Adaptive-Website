// components/product/ColorSwatch.tsx
"use client";
import { cn } from "@/lib/utils";

type Props = {
  colors: string[];
  value?: string;
  onChange?: (c: string) => void;
};

function prettyColorName(c: string): string {
  const key = c.trim().toLowerCase();
  const map: Record<string, string> = {
    "#fff": "Clear / White",
    "#ffffff": "Clear / White",
    white: "Clear / White",
    "#111": "Black",
    "#000": "Black",
    "#000000": "Black",
    black: "Black",
  };
  if (map[key]) return map[key];
  if (c.startsWith("#")) return c.toUpperCase();
  return c;
}

export function ColorSwatch({ colors, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {colors.map((c) => {
          const active = value === c;
          const isLight =
            c.trim().toLowerCase() === "#fff" ||
            c.trim().toLowerCase() === "#ffffff" ||
            c.trim().toLowerCase() === "white";
          return (
            <button
              key={c}
              type="button"
              title={prettyColorName(c)}
              onClick={() => onChange?.(c)}
              aria-pressed={active}
              className={cn(
                "h-9 w-9 shrink-0 rounded-full border transition",
                isLight ? "border-neutral-300" : "border-transparent",
                active
                  ? "outline outline-2 outline-offset-2 outline-neutral-900"
                  : "hover:opacity-90"
              )}
              style={{ backgroundColor: c }}
            />
          );
        })}
      </div>
      {value ? (
        <p className="text-xs text-neutral-500">
          Selected:{" "}
          <span className="font-medium text-neutral-800">
            {prettyColorName(value)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
