// components/shared/Tabs.tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = { id: string; label: string; content: React.ReactNode; default?: boolean };

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const defaultId = tabs.find((t) => t.default)?.id ?? tabs[0].id;
  const [active, setActive] = useState(defaultId);

  return (
    <div>
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm",
              active === t.id ? "border-b-2 border-neutral-900 font-semibold" : "text-neutral-500 hover:text-neutral-900"
            )}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-b-md bg-white py-6">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
