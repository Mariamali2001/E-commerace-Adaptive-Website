import { AdaptiveHero } from "@/components/adaptive/AdaptiveHero";
import { AdaptiveCategoryStrip } from "@/components/adaptive/AdaptiveCategoryStrip";
import { DealOfWeek } from "@/components/home/DealOfWeek";
import { Stats } from "@/components/home/Stats";
import { TopSelling } from "@/components/home/TopSelling";
import { Trending } from "@/components/home/Trending";
import { listProducts } from "@/server/products";

export default async function HomePage() {
  // Larger pool so recommendation_type (deals / new / trending) can pick meaningfully
  const ranked = await listProducts({ sort: "rating", limit: 24 });
  const topSelling = ranked;
  const trending = ranked.slice(0, 5);

  return (
    <>
      <AdaptiveHero />
      <AdaptiveCategoryStrip />
      <DealOfWeek />
      <Stats />
      <TopSelling products={topSelling} />
      <Trending products={trending} />
    </>
  );
}
