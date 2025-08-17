import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import TopSelling from "@/components/home/TopSelling";
import Trending from "@/components/home/Trending";
import DealOfWeek from "@/components/home/DealOfWeek";
import Newsletter from "@/components/shared/Newsletter";

export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-20">
      <Hero />
      <Stats />
      <TopSelling />
      <Trending />
      <DealOfWeek />
      <Newsletter />
    </div>
  );
}