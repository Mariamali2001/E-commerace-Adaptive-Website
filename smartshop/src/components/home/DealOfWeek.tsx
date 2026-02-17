"use client";

// components/home/DealOfWeek.tsx
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { useCart } from "@/store/cart";
import { Price } from "../shared/Price";

type Deal = {
  id: string;
  slug: string;
  title: string;
  price: number;
  bullet: string[];
  image: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function DealOfWeek() {
  const router = useRouter();
  const add = useCart((s) => s.add);

  // Set deal end date (7 days from now for this example)
  const [dealEndDate] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 7); // Deal ends in 7 days
    return end;
  });

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = dealEndDate.getTime() - now;

      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [dealEndDate]);

  const deals: Deal[] = [
    {
      id: "deal-perfume",
      slug: "elegant-perfume",
      title: "Elegant Perfumes",
      price: 50,
      bullet: ["Long lasting", "Affordable price", "Best Perfume"],
      image: "/images/deal-perfume.jpg",
    },
    {
      id: "deal-shampoo",
      slug: "silky-shampoo",
      title: "Shampoo",
      price: 18.88,
      bullet: ["Allergy free", "Best Product", "Affordable price"],
      image: "/images/shampoo.jpg",
    },
    {
      id: "deal-air-max",
      slug: "red-nike-air-max",
      title: "Red Nike Air Max",
      price: 100,
      bullet: ["Best Product", "Affordable price", "Summer collection"],
      image: "/images/prod3.jpg",
    },
  ];

  const handleBuyNow = (deal: Deal) => {
    add({
      id: deal.id,
      slug: deal.slug,
      title: deal.title,
      price: deal.price,
      image: deal.image,
      qty: 1,
    });
    router.push("/shop/cart");
  };

  return (
    <section id="deals" className="container mt-14">
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold">Deal Of The Week</h2>
        <div className="ml-auto flex gap-2 text-xs">
          <TimerPill v={timeLeft.days.toString().padStart(2, "0")} u="Days" />
          <TimerPill v={timeLeft.hours.toString().padStart(2, "0")} u="Hours" />
          <TimerPill v={timeLeft.minutes.toString().padStart(2, "0")} u="Minutes" />
          <TimerPill v={timeLeft.seconds.toString().padStart(2, "0")} u="Seconds" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        {deals.map((deal) => (
          <Card key={deal.id} deal={deal} onBuy={() => handleBuyNow(deal)} />
        ))}
      </div>
    </section>
  );
}

function Card({ deal, onBuy }: { deal: Deal; onBuy: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200">
      <div className="aspect-video w-full bg-neutral-100">
        <img src={deal.image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <h3 className="font-semibold">{deal.title}</h3>
        <Price price={deal.price} />
        <ul className="space-y-2 text-sm text-neutral-600">
          {deal.bullet.map((b, i) => (
            <li key={i} className="flex items-center gap-2">
              {b}
            </li>
          ))}
        </ul>
        <button onClick={onBuy} className="btn w-full bg-neutral-900 text-white hover:opacity-90">
          Buy Now
        </button>
      </div>
    </div>
  );
}

function TimerPill({ v, u }: { v: string; u: string }) {
  return (
    <div className="rounded-md bg-neutral-900 px-2 py-1 text-white">
      <div className="text-center leading-none">
        <div className="text-sm font-bold">{v}</div>
        <div className="text-[10px] opacity-70">{u}</div>
      </div>
    </div>
  );
}
