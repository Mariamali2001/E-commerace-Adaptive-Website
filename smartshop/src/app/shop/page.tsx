// app/(shop)/page.tsx
import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { TopSelling } from "@/components/home/TopSelling";
import { Trending } from "@/components/home/Trending";
import { DealOfWeek } from "@/components/home/DealOfWeek";
import { Newsletter } from "@/components/shared/Newsletter";
import { products } from "@/data/products";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <TopSelling products={products.slice(0, 8)} />
      <Trending />
      <DealOfWeek />
      <Newsletter />
    </>
  );
}
