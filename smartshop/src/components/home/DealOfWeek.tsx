// components/home/DealOfWeek.tsx
import { Price } from "../shared/Price";

export function DealOfWeek() {
  return (
    <section className="container mt-14">
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold">Deal Of The Week</h2>
        <div className="ml-auto flex gap-2 text-xs">
          <TimerPill v="10" u="Days" /><TimerPill v="19" u="Hours" />
          <TimerPill v="59" u="Minutes" /><TimerPill v="57" u="Seconds" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card
          title="Elegant Perfumes"
          price={16}
          bullet={["Long Lasting", "Affordable price", "Best Perfume"]}
          image="/images/deal-perfume.jpg"
        />
        <Card
          title="Shampoo"
          price={18.88}
          bullet={["Allergy free", "Best Product", "Affordable price"]}
          image="/images/deal-shampoo.jpg"
        />
        <Card title="Strawberry Shampoo" price={18.88} bullet={["Allergy free", "Best Product", "Affordable price"]} image="src/Image/deal-strawberry.png" />
      </div>
    </section>
  );
}

function Card({ title, price, bullet, image }: { title: string; price: number; bullet: string[]; image: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200">
      <div className="aspect-video w-full bg-neutral-100">
        <img src={image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <h3 className="font-semibold">{title}</h3>
        <Price price={price} />
        <ul className="space-y-2 text-sm text-neutral-600">
          {bullet.map((b, i) => (
            <li key={i} className="flex items-center gap-2"> {b}</li>
          ))}
        </ul>
        <button className="btn w-full bg-neutral-900 text-white hover:opacity-90">Buy Now</button>
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
