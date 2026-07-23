import Link from "next/link";

/** Implements hero_banner = Small Strip */
export function SmallStripHero() {
  return (
    <section className="border-b border-neutral-200 bg-neutral-50">
      <div className="container flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            SmartShop
          </p>
          <h1 className="text-lg font-bold text-neutral-900 sm:text-xl">
            Clothes that match your style
          </h1>
        </div>
        <Link
          href="/shop"
          className="inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}
