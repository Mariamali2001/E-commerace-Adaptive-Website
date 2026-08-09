import type { ReactNode } from "react";

export interface FilterPanelProps {
  children?: ReactNode;
}

export function TopBarFilterPanel({
  children,
}: FilterPanelProps): JSX.Element {
  return (
    <div
      role="region"
      aria-label="Filters"
      className="w-full border-b border-slate-200 bg-white"
    >
      <div className="flex min-h-10 items-center gap-2 overflow-x-auto px-3 py-2">
        {children}
      </div>
    </div>
  );
}