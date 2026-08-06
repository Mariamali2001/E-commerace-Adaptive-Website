import type { ReactNode } from "react";

type FilterPanelProps = {
  children: ReactNode;
};

export function SidebarLeftFilterPanel({ children }: FilterPanelProps) {
  return (
    <aside
      aria-label="Filters"
      className="sticky left-0 top-0 h-screen w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white"
    >
      <div className="space-y-6 p-6">{children}</div>
    </aside>
  );
}