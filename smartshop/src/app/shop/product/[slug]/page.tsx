// app/product/[slug]/page.tsx
import { notFound } from "next/navigation";
import { products } from "@/data/products";
import { Product } from "@/types/product";
import { Gallery } from "@/app/components/product/Gallery";
import { ColorSwatch } from "@/app/components/product/ColorSwatch";
import { SizePill } from "@/app/components/product/SizePill";
import { QtyStepper } from "@/app/components/product/QtyStepper";
import { Price } from "@/app/components/shared/Price";
import { RatingStars } from "@/app/components/shared/RatingStars";
import { Tabs } from "@/app/components/shared/Tabs";
import { ReviewsList } from "@/app/components/product/Reviews";
import { reviews } from "@/data/reviews";
import { useState } from "react";
import { useCart } from "@/store/cart";

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((p) => p.slug === params.slug) as Product | undefined;
  if (!product) return notFound();

  const productReviews = reviews.filter((r) => r.productId === product.id);

  // 👇 cart + UI state
  const add = useCart((s) => s.add);
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(1);

  return (
    <div className="container mt-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Gallery images={product.images} thumbs={product.images} />

        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight">{product.title}</h1>
          <div className="flex items-center gap-2">
            <RatingStars rating={product.rating} />
            <span className="text-sm text-neutral-500">{product.rating.toFixed(1)}/5</span>
          </div>

          <Price price={product.price} compareAt={product.compareAt} className="text-2xl" />
          <p className="text-sm text-neutral-600 max-w-prose">{product.description}</p>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Select Colors</p>
            <ColorSwatch colors={product.colors} value={color} onChange={setColor} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Choose Size</p>
            <SizePill sizes={product.sizes} value={size} onChange={setSize} />
          </div>

          <QtyStepper min={1} max={10} value={qty} onChange={setQty} />

          <button
            onClick={() =>
              add({
                id: product.id,
                slug: product.slug,
                title: product.title,
                price: product.price,
                image: product.images[0],
                size,
                color,
                qty,
              })
            }
            className="btn bg-neutral-900 text-white hover:opacity-90 w-full md:w-auto"
          >
            Add to Cart
          </button>
        </div>
      </div>

      <div className="mt-12">
        <Tabs
          tabs={[
            {
              id: "details",
              label: "Product Details",
              content: (
                <div className="text-sm leading-relaxed text-neutral-700">
                  {product.details ?? "High-quality fabric, modern fit, breathable and durable."}
                </div>
              ),
            },
            {
              id: "reviews",
              label: `Rating & Reviews`,
              content: <ReviewsList reviews={productReviews} />,
              default: true,
            },
            {
              id: "faqs",
              label: "FAQs",
              content: (
                <ul className="list-disc space-y-2 pl-6 text-sm text-neutral-700">
                  <li>Free returns within 30 days.</li>
                  <li>Standard delivery 3–5 business days.</li>
                  <li>Wash cold, tumble dry low.</li>
                </ul>
              ),
            },
          ]}
        />
      </div>

      <div className="mt-16">
        <h2 className="mb-6 text-2xl font-bold">You might also like</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <a key={p.id} href={`/product/${p.slug}`} className="group">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-100" />
              <div className="mt-2">
                <p className="text-sm font-medium">{p.title}</p>
                <div className="flex items-center gap-2">
                  <Price price={p.price} compareAt={p.compareAt} />
                  <span className="text-xs text-neutral-500">•</span>
                  <RatingStars rating={p.rating} small />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
