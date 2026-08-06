"use client";

import { AdaptiveProductDesc } from "./AdaptiveProductDesc";

/** Product Details tab content — respects product_desc_length. */
export function AdaptiveProductDetailsTab({ text }: { text: string }) {
  return (
    <AdaptiveProductDesc
      text={text}
      className="leading-relaxed text-neutral-700"
    />
  );
}
