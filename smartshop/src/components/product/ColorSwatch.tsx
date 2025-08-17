// components/product/ColorSwatch.tsx
"use client";
import { cn } from "@/lib/utils";

type Props = {
  colors: string[];
  value?: string;
  onChange?: (c: string) => void;
};

export function ColorSwatch({ colors, value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {colors.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            title={c}
            onClick={() => onChange?.(c)}
            className={cn(
              "h-8 w-8 rounded-full ring-1 ring-inset ring-black/10",
              active && "outline outline-2 outline-neutral-900"
            )}
            style={{ background: c }}
          />
        );
      })}
    </div>
  );
}
