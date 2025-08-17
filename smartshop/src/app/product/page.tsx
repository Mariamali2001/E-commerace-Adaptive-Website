import { Gallery } from "@/components/product/Gallery";
import { products } from "@/data/products";

export default function ProductPage() {
  const product = products[0]; // static for now
  return (
    <>
      <Gallery images={product.images} />
    </>
  );
}
