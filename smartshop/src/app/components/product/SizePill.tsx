// // components/product/SizePill.tsx
// "use client";
// import { useState } from "react";
// import { cn } from "@/lib/utils";

// export function SizePill({ sizes }: { sizes: string[] }) {
//   const [active, setActive] = useState(sizes[0]);
//   return (
//     <div className="flex gap-2">
//       {sizes.map((s) => (
//         <button
//           key={s}
//           onClick={() => setActive(s)}
//           className={cn(
//             "rounded-xl border px-3 py-1.5 text-sm",
//             active === s ? "border-neutral-900 font-semibold" : "border-neutral-200 text-neutral-600"
//           )}
//         >
//           {s}
//         </button>
//       ))}
//     </div>
//   );
// }
// components/product/SizePill.tsx
"use client";
import { cn } from "@/lib/utils";

type Props = {
  sizes: string[];
  value?: string;
  onChange?: (s: string) => void;
};

export function SizePill({ sizes, value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {sizes.map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange?.(s)}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-sm",
              active
                ? "border-neutral-900 font-semibold"
                : "border-neutral-200 text-neutral-600"
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
