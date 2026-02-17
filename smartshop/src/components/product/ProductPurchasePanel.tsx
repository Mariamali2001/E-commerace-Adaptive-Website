"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Product } from "@/types/product";
import { useCart } from "@/store/cart";
import { ColorSwatch } from "./ColorSwatch";
import { SizePill } from "./SizePill";
import { QtyStepper } from "./QtyStepper";
import { Price } from "../shared/Price";
import { RatingStars } from "../shared/RatingStars";

type Props = {
  product: Product;
  onColorChange?: (colorIndex: number) => void;
};

export function ProductPurchasePanel({ product, onColorChange }: Props) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    // Find the index of the selected color and notify parent
    const colorIndex = product.colors.indexOf(newColor);
    if (colorIndex !== -1 && onColorChange) {
      onColorChange(colorIndex);
    }
  };

  const handleAddToCart = () => {
    add({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.images[0],
      size,
      color,
      qty,
    });
    setShowConfirmation(true);
  };

  return (
    <div className="space-y-4 relative">
      <h1 className="text-3xl font-extrabold tracking-tight">{product.title}</h1>
      <div className="flex items-center gap-2">
        <RatingStars rating={product.rating} />
        <span className="text-sm text-neutral-500">{product.rating.toFixed(1)}/5</span>
      </div>

      <Price price={product.price} compareAt={product.compareAt} className="text-2xl" />
      <p className="text-sm text-neutral-600 max-w-prose">{product.description}</p>

      {product.colors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Select Colors</p>
          <ColorSwatch colors={product.colors} value={color} onChange={handleColorChange} />
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Choose Size</p>
          <SizePill sizes={product.sizes} value={size} onChange={setSize} />
        </div>
      )}

      <QtyStepper min={1} max={10} value={qty} onChange={setQty} />

      <button
        onClick={handleAddToCart}
        className="btn bg-neutral-900 text-white hover:opacity-90 w-full md:w-auto"
      >
        Add to Cart
      </button>

      {showConfirmation && (
        <div
          role="dialog"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-8 w-8 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 12.5l2.5 2.5L16 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="text-lg font-semibold">Added to your cart!</p>
                <p className="text-sm text-neutral-600">
                  {product.title}
                  {(size || color) && (
                    <span>
                      {' '}({[size, color].filter(Boolean).join(' / ') || 'Standard'})
                    </span>
                  )} has been added.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn bg-neutral-900 text-white hover:opacity-90 flex-1"
                onClick={() => {
                  setShowConfirmation(false);
                  router.push("/shop/cart");
                }}
              >
                Go to Cart
              </button>
              <button
                type="button"
                className="btn border border-neutral-200 bg-white text-neutral-900 hover:opacity-90 flex-1"
                onClick={() => setShowConfirmation(false)}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

