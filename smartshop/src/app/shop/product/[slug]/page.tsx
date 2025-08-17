// src/app/(shop)/product/[slug]/page.tsx
import Gallery from "@/components/product/Gallery";
import ColorSwatch from "@/components/product/ColorSwatch";
import SizePill from "@/components/product/SizePill";
import QtyStepper from "@/components/product/QtyStepper";
import Tabs from "@/components/shared/Tabs";
import Reviews from "@/components/product/Reviews";
import { tokens } from "@/lib/tokens";

export default function ProductPage() {
  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <Gallery />
      <section className="space-y-6">
        <h1 className="text-3xl font-extrabold">ONE LIFE GRAPHIC T‑SHIRT</h1>
        {/* Price pair */}
        <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">$260</span><span className="text-muted line-through">$300</span></div>
        <p className="text-muted">This graphic t‑shirt is perfect…</p>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Select Colors</div>
          <div className="flex gap-2"><ColorSwatch color="#1e293b"/><ColorSwatch color="#334155"/><ColorSwatch color="#111827"/></div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Choose Size</div>
          <div className="flex flex-wrap gap-2">
            {["Small","Medium","Large","X‑Large"].map(s => <SizePill key={s} label={s} />)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <QtyStepper />
          <button className={tokens.btn.primary}>Add to Cart</button>
        </div>
      </section>

      <div className="col-span-full mt-8">
        <Tabs tabs={["Product Details","Rating & Reviews","FAQs"]}>
          <div>Details content…</div>
          <Reviews />
          <div>FAQs content…</div>
        </Tabs>
      </div>
    </div>
  );
}
