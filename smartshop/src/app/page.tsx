import { AdaptiveHero } from "@/components/adaptive/AdaptiveHero";
import { DealOfWeek } from "@/components/home/DealOfWeek";
import { Stats } from "@/components/home/Stats";
import { TopSelling } from "@/components/home/TopSelling";
import { Trending } from "@/components/home/Trending";
import { listProducts } from "@/server/products";

export default async function HomePage() {
  const topSelling = await listProducts({ sort: "rating", limit: 4 });
  const trending = await listProducts({ sort: "rating", limit: 5 });

  return (
    <>
      <AdaptiveHero />
      <DealOfWeek />
      <Stats />
      <TopSelling products={topSelling} />
      <Trending products={trending} />
    </>
  );
}
