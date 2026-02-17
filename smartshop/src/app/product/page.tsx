import { notFound } from "next/navigation";

import { Gallery } from "@/components/product/Gallery";
import { listProducts } from "@/server/products";

export default async function ProductPage() {
  const [product] = await listProducts({ limit: 1 });
  if (!product) return notFound();

  return <Gallery images={product.images} />;
}
