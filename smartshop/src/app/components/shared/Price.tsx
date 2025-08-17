// components/shared/Price.tsx
import { cn } from "@/lib/utils";

export function Price({ price, compareAt, className }: { price: number; compareAt?: number; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="font-extrabold">${price}</span>
      {compareAt && <s className="text-neutral-400">${compareAt}</s>}
      {compareAt && (
        <span className="text-xs text-red-500">-{Math.round(((compareAt - price) / compareAt) * 100)}%</span>
      )}
    </div>
  );
}
