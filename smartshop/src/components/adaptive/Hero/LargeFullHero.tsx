import Link from "next/link";

/**
 * Large Full screen — left-aligned copy; crop keeps the model's face in frame.
 */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2400&q=80";

export function LargeFullHero() {
  return (
    <section
      className="adaptive-hero relative min-h-[min(92svh,52rem)] w-full overflow-hidden"
      data-hero-size="large"
    >
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[72%_12%]"
      />
      {/* Left wash only — face/bags stay clear on the right */}
      <div className="adaptive-hero-scrim absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

      <div className="container relative flex min-h-[min(92svh,52rem)] items-center py-16 md:py-20">
        <div className="max-w-lg text-left text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
            SmartShop
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl">
            FIND CLOTHES
            <br />
            THAT MATCHES
            <br />
            YOUR STYLE
          </h1>
          <p className="adaptive-hero-copy mt-5 max-w-md text-sm leading-relaxed text-white/90">
            Browse through our diverse range of meticulously crafted garments,
            designed to bring out your individuality and cater to your sense of
            style.
          </p>
          <Link
            href="/shop"
            className="btn mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-neutral-900 shadow-lg transition hover:bg-neutral-100"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
