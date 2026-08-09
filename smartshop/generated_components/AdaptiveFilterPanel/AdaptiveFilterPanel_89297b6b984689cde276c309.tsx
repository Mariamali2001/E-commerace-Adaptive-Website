import type { ReactNode } from "react";

export interface FilterPanelProps {
  children?: ReactNode;
  className?: string;
}

export function SidebarLeftFilterPanel({
  children,
  className = "",
}: FilterPanelProps) {
  return (
    <aside
      aria-label="Filters"
      className={`sticky left-0 top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white ${className}`}
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </aside>
  );
}