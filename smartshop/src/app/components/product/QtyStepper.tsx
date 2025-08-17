
// components/product/QtyStepper.tsx
"use client";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  className?: string;
};

export function QtyStepper({ value, min = 1, max = 99, onChange, className }: Props) {
  const update = (newVal: number) => {
    if (newVal < min || newVal > max) return;
    onChange(newVal);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-4 rounded-xl border border-neutral-200 px-3 py-2",
        className
      )}
    >
      <button
        type="button"
        onClick={() => update(value - 1)}
        aria-label="Decrease quantity"
        className="text-lg font-bold"
      >
        −
      </button>
      <span className="min-w-[1.5ch] text-center">{value}</span>
      <button
        type="button"
        onClick={() => update(value + 1)}
        aria-label="Increase quantity"
        className="text-lg font-bold"
      >
        +
      </button>
    </div>
  );
}

// "use client";
// import { useState } from "react";
// import { cn } from "@/lib/utils";

// type Props = {
//   value?: number;
//   min?: number;
//   max?: number;
//   onChange?: (val: number) => void;
//   className?: string;
// };

// export function QtyStepper({ value = 1, min = 1, max = 99, onChange, className }: Props) {
//   const [qty, setQty] = useState(value);

//   const update = (newVal: number) => {
//     if (newVal < min || newVal > max) return;
//     setQty(newVal);
//     onChange?.(newVal);
//   };

//   return (
//     <div
//       className={cn(
//         "inline-flex items-center gap-4 rounded-xl border border-neutral-200 px-3 py-2",
//         className
//       )}
//     >
//       <button
//         type="button"
//         onClick={() => update(qty - 1)}
//         aria-label="Decrease quantity"
//         className="text-lg font-bold"
//       >
//         −
//       </button>
//       <span className="min-w-[1.5ch] text-center">{qty}</span>
//       <button
//         type="button"
//         onClick={() => update(qty + 1)}
//         aria-label="Increase quantity"
//         className="text-lg font-bold"
//       >
//         +
//       </button>
//     </div>
//   );
// }
