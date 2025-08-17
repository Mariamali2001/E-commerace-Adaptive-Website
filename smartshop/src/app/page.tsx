import { Hero } from "@/components/home/Hero";
import { DealOfWeek } from "@/components/home/DealOfWeek";
import { Stats } from "@/components/home/Stats";
import { TopSelling } from "@/components/home/TopSelling";
import { Trending } from "@/components/home/Trending";

export default function HomePage() {
  return (
    <>
      <Hero />
      <DealOfWeek />
      <Stats />
      <TopSelling products={[]} />
      <Trending />
    </>
  );
}
