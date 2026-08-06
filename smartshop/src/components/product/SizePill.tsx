"use client";
import { cn } from "@/lib/utils";

type Props = {
  sizes: string[];
  value?: string;
  onChange?: (s: string) => void;
};

export function SizePill({ sizes, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2.5">
        {sizes.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange?.(s)}
              className={cn(
                "min-w-[5.5rem] rounded-xl border px-5 py-2.5 text-sm font-semibold transition",
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
      {value ? (
        <p className="text-xs text-neutral-500">
          Selected size:{" "}
          <span className="font-medium text-neutral-800">{value}</span>
        </p>
      ) : null}
    </div>
  );
}
