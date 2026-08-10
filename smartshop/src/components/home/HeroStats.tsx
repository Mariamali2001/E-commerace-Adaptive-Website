const STATS = [
  { value: "200+", label: "International Brands" },
  { value: "2,000+", label: "High-Quality Products" },
  { value: "30,000+", label: "Happy Customers" },
] as const;

/** Hero trust metrics — wraps cleanly on narrow screens. */
export function HeroStats() {
  return (
    <ul className="mt-8 flex flex-wrap" aria-label="Store highlights">
      {STATS.map((stat, i) => (
        <li
          key={stat.label}
          className={[
            "py-1",
            i < 2
              ? "w-1/2 sm:w-auto sm:flex-1 sm:min-w-[7.5rem]"
              : "mt-3 w-full border-t border-neutral-200 pt-3 sm:mt-0 sm:w-auto sm:flex-1 sm:min-w-[7.5rem] sm:border-t-0 sm:pt-1",
            i === 0 ? "border-r border-neutral-200 pr-4 sm:pr-6" : "",
            i === 1 ? "pl-4 sm:border-r sm:border-neutral-200 sm:pr-6" : "",
            i === 2 ? "sm:pl-6" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <p className="text-2xl font-extrabold tracking-tight tabular-nums sm:text-[1.75rem]">
            {stat.value}
          </p>
          <p className="mt-1 max-w-[9rem] text-xs leading-snug text-neutral-500 sm:max-w-none sm:text-sm">
            {stat.label}
          </p>
        </li>
      ))}
    </ul>
  );
}
