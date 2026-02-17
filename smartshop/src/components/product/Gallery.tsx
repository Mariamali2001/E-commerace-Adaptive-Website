// components/product/Gallery.tsx
"use client";
import { useState, useEffect } from "react";

export function Gallery({ 
  images, 
  thumbs, 
  initialActive = 0 
}: { 
  images: string[]; 
  thumbs?: string[];
  initialActive?: number;
}) {
  const [active, setActive] = useState(initialActive);

  // Update active image when initialActive changes (e.g., color selection)
  useEffect(() => {
    if (initialActive < images.length) {
      setActive(initialActive);
    }
  }, [initialActive, images.length]);
  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="col-span-1 flex flex-col gap-3">
        {(thumbs ?? images).slice(0, 4).map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`aspect-square overflow-hidden rounded-xl border ${i === active ? "border-neutral-900" : "border-neutral-200"}`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="col-span-4">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100">
          <img src={images[active]} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}
