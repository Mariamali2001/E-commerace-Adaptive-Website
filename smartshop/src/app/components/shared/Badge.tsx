// components/shared/Badge.tsx
import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white", className)}>
      {children}
    </span>
  );
}
