import Link from "next/link";

/** Implements hero_banner = Medium Split — surfaces follow Adaptive theme CSS */
export function MediumSplitHero() {
  return (
    <section className="adaptive-hero border-b border-neutral-200/60">
      <div className="container grid grid-cols-1 gap-8 py-10 md:grid-cols-2">
        <div className="self-center">
          <h1 className="display-1 leading-[0.95]">
            FIND CLOTHES
            <br />
            THAT MATCHES
            <br />
            YOUR STYLE
          </h1>
          <p className="adaptive-hero-copy mt-4 max-w-xl text-sm text-neutral-600">
            Browse through our diverse range of meticulously crafted garments,
            designed to bring out your individuality and cater to your sense of
            style.
          </p>
          <Link
            href="/shop"
            className="btn mt-6 inline-block rounded-xl bg-neutral-900 text-white hover:opacity-90"
          >
            Shop Now
          </Link>
          <div className="mt-8 grid grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-2xl font-extrabold">200+</p>
              <p className="text-neutral-500">International Brands</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">2,000+</p>
              <p className="text-neutral-500">High-Quality Products</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">30,000+</p>
              <p className="text-neutral-500">Happy Customers</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="adaptive-hero-media aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
