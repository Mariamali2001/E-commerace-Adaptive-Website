// components/product/Gallery.tsx
"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Gallery({
  images,
  thumbs,
  initialActive = 0,
}: {
  images: string[];
  thumbs?: string[];
  initialActive?: number;
}) {
  const [active, setActive] = useState(initialActive);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

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
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "aspect-square overflow-hidden rounded-xl border bg-neutral-50 p-1",
              i === active ? "border-neutral-900" : "border-neutral-200"
            )}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-contain"
            />
          </button>
        ))}
      </div>
      <div className="col-span-4">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-50"
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setOrigin(`${x}% ${y}%`);
          }}
        >
          <img
            src={images[active]}
            alt=""
            className={cn(
              "h-full w-full object-contain p-3 transition-transform duration-200 ease-out",
              zooming ? "cursor-zoom-in" : "cursor-default"
            )}
            style={{
              transformOrigin: origin,
              transform: zooming ? "scale(1.45)" : "scale(1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
