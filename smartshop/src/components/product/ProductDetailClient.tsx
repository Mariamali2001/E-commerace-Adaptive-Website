"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { Gallery } from "./Gallery";
import { ProductPurchasePanel } from "./ProductPurchasePanel";

type Props = {
  product: Product;
};

export function ProductDetailClient({ product }: Props) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const handleColorChange = (colorIndex: number) => {
    setSelectedColorIndex(colorIndex);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
      <Gallery
        images={product.images}
        thumbs={product.images}
        initialActive={selectedColorIndex}
      />
      <ProductPurchasePanel
        product={product}
        onColorChange={handleColorChange}
      />
    </div>
  );
}
