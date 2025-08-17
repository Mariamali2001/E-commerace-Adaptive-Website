// components/home/Hero.tsx
import Link from "next/link";

export function Hero() {
  return (
    <section className="container grid grid-cols-1 gap-8 py-10 md:grid-cols-2">
      <div className="self-center">
        <h1 className="display-1 leading-[0.95]">FIND CLOTHES<br/>THAT MATCHES<br/>YOUR STYLE</h1>
        <p className="mt-4 max-w-xl text-sm text-neutral-600">
          Browse through our diverse range of meticulously crafted garments,
          designed to bring out your individuality and cater to your sense of style.
        </p>
        <Link href="/#shop" className="btn mt-6 bg-neutral-900 text-white hover:opacity-90">Shop Now</Link>

        <div className="mt-8 grid grid-cols-3 gap-6 text-sm">
          <div><p className="text-2xl font-extrabold">200+</p><p className="text-neutral-500">International Brands</p></div>
          <div><p className="text-2xl font-extrabold">2,000+</p><p className="text-neutral-500">High-Quality Products</p></div>
          <div><p className="text-2xl font-extrabold">30,000+</p><p className="text-neutral-500">Happy Customers</p></div>
        </div>
      </div>

      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100">
          <img src="/images/hero-models.png" alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
