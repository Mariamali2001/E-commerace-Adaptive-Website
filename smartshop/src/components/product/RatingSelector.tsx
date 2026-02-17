// components/product/RatingSelector.tsx
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
};

export function RatingSelector({ value, onChange, disabled = false }: Props) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const displayRating = hoveredRating || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHoveredRating(0)}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => onChange(rating)}
          onMouseEnter={() => !disabled && setHoveredRating(rating)}
          className={cn(
            "transition-transform hover:scale-110",
            disabled && "cursor-not-allowed opacity-50"
          )}
          aria-label={`Rate ${rating} out of 5`}
        >
          <span className="text-2xl">
            {rating <= displayRating ? "⭐" : "☆"}
          </span>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-neutral-600">{value}/5</span>
      )}
    </div>
  );
}

