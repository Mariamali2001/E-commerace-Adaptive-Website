import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { ReviewsList } from "@/components/product/Reviews";
import { Price } from "@/components/shared/Price";
import { RatingStars } from "@/components/shared/RatingStars";
import { Tabs } from "@/components/shared/Tabs";
import { listProducts, getProductBySlug } from "@/server/products";
import { listReviews } from "@/server/reviews";

export async function generateStaticParams() {
  const products = await listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return notFound();
  }

  const [productReviews, relatedCandidates] = await Promise.all([
    listReviews(product.id),
    listProducts({ sort: "rating", limit: 8 }),
  ]);

  const related = relatedCandidates.filter((item) => item.id !== product.id).slice(0, 4);

  return (
    <div className="container mt-6">
      <ProductDetailClient product={product} />

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
              content: <ReviewsList reviews={productReviews} productSlug={slug} />,
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
          {related.map((item) => (
            <a key={item.id} href={`/shop/product/${item.slug}`} className="group">
              <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold leading-tight min-h-[2.5rem]">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Price price={item.price} compareAt={item.compareAt} />
                  <span className="text-xs text-neutral-500">•</span>
                  <RatingStars rating={item.rating} small />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
