// components/shared/RatingStars.tsx
export function RatingStars({ rating, small }: { rating: number; small?: boolean }) {
  const size = small ? "text-[10px]" : "text-sm";
  return (
    <div className={`flex ${size}`} aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < Math.round(rating) ? "⭐" : "☆"}</span>
      ))}
    </div>
  );
}
