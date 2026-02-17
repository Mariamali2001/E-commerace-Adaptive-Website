// components/layout/PromoBar.tsx
import Link from "next/link";

export function PromoBar() {
  return (
    <div className="w-full bg-neutral-900 text-white">
      <div className="container py-2 text-center text-xs md:text-[13px]">
        Summer Sale For All Swim Suits And Free Express Delivery – OFF <b>50%</b>
        <Link href="/shop?sale=50" className="ml-2 underline hover:opacity-80">ShopNow</Link>
      </div>
    </div>
  );
}
