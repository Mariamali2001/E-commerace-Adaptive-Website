// components/home/Hero.tsx
import Image from "next/image";
import { tokens } from "@/lib/tokens";
export default function Hero() {
  return (
    <section className="grid md:grid-cols-2 gap-8 items-center">
      <div className="space-y-5">
        <h1 className="text-5xl md:text-6xl font-black leading-[1.05]">FIND CLOTHES THAT MATCHES YOUR STYLE</h1>
        <p className="text-muted">Browse through our diverse range…</p>
        <button className={tokens.btn.primary}>Shop Now</button>
        <div className="grid grid-cols-3 gap-6 pt-6 text-sm">
          <div><div className="text-2xl font-extrabold">200+</div>International Brands</div>
          <div><div className="text-2xl font-extrabold">2,000+</div>High‑Quality Products</div>
          <div><div className="text-2xl font-extrabold">30,000+</div>Happy Customers</div>
        </div>
      </div>
      <div className="relative h-[420px] md:h-[520px] rounded-2xl overflow-hidden shadow-card">
        <Image src="/images/hero.jpg" alt="Models" fill className="object-cover" />
      </div>
    </section>
  );
}