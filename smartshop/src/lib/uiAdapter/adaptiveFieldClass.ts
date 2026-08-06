import { cn } from "@/lib/utils";

/**
 * Shared input/textarea/select class for Adaptive Engine form_field_style.
 * Visual variants come from html[data-form-fields] CSS; this only sets sizing.
 */
export function adaptiveFieldClass(opts?: {
  compact?: boolean;
  className?: string;
}) {
  return cn(
    "adaptive-field w-full outline-none transition",
    opts?.compact ? "px-3 py-2 text-sm" : "px-4 py-3",
    opts?.className
  );
}
