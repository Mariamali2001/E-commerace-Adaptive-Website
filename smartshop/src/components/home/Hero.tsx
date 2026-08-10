// components/home/Hero.tsx
import Link from "next/link";
import { HeroStats } from "./HeroStats";

export function Hero() {
  return (
    <section className="container grid grid-cols-1 gap-8 py-10 md:grid-cols-2">
      <div className="self-center">
        <h1 className="display-1 leading-[0.95]">FIND CLOTHES<br/>THAT MATCHES<br/>YOUR STYLE</h1>
        <p className="mt-4 max-w-xl text-sm text-neutral-600">
          Browse through our diverse range of meticulously crafted garments,
          designed to bring out your individuality and cater to your sense of style.
        </p>
        <Link
          href="/shop"
          className="btn mt-6 bg-neutral-900 text-white hover:opacity-90 inline-block"
        >
          Shop Now
        </Link>

        <HeroStats />
      </div>

      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100">
          <img src="/images/hero-models.png" alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
