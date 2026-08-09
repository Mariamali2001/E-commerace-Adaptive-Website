import Link from "next/link";

/** Implements hero_banner = Large Full screen — full first-viewport promo */
export function LargeFullHero() {
  return (
    <section className="adaptive-hero relative min-h-[min(100svh,56rem)] w-full overflow-hidden border-b border-neutral-200/60">
      <img
        src="/images/hero-models.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/15" />
      <div className="container relative flex min-h-[min(100svh,56rem)] flex-col justify-center py-16 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          SmartShop
        </p>
        <h1 className="display-1 mt-3 max-w-3xl leading-[0.95] text-white">
          FIND CLOTHES
          <br />
          THAT MATCHES
          <br />
          YOUR STYLE
        </h1>
        <p className="adaptive-hero-copy mt-5 max-w-xl text-sm text-white/85">
          Browse through our diverse range of meticulously crafted garments,
          designed to bring out your individuality and cater to your sense of
          style.
        </p>
        <Link
          href="/shop"
          className="btn mt-8 inline-block w-fit rounded-xl bg-white px-6 py-3 text-neutral-900 hover:opacity-90"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}
