import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { AdaptiveReviews } from "@/components/adaptive/AdaptiveReviews";
import { AdaptiveProductDetailsTab } from "@/components/adaptive/AdaptiveProductDetailsTab";
import { AdaptiveProductCard } from "@/components/adaptive/AdaptiveProductCard";
import { Tabs } from "@/components/shared/Tabs";
import { listProducts, getProductBySlug } from "@/server/products";
import { listReviews } from "@/server/reviews";

export async function generateStaticParams() {
  const products = await listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Product + related in parallel (reviews need product.id after)
  const [product, relatedCandidates] = await Promise.all([
    getProductBySlug(slug),
    listProducts({ sort: "rating", limit: 8 }),
  ]);
  if (!product) {
    return notFound();
  }

  const productReviews = await listReviews(product.id);

  const related = relatedCandidates.filter((item) => item.id !== product.id).slice(0, 4);

  return (
    <div className="container mt-6 mb-8">
      <ProductDetailClient product={product} />

      <div className="mt-8">
        <Tabs
          tabs={[
            {
              id: "details",
              label: "Product Details",
              content: (
                <AdaptiveProductDetailsTab
                  text={
                    product.details ??
                    "High-quality fabric, modern fit, breathable and durable."
                  }
                />
              ),
            },
            {
              id: "reviews",
              label: `Rating & Reviews`,
              content: (
                <AdaptiveReviews reviews={productReviews} productSlug={slug} />
              ),
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

      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">You might also like</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {related.map((item) => (
            <AdaptiveProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
