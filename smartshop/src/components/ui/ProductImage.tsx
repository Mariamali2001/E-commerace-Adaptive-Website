"use client";

import { useEffect, useState } from "react";

const FALLBACK = "/images/prod1.jpg";

type ProductImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  style?: React.CSSProperties;
};

/** Product photo with a local fallback when a remote URL 404s or is hotlink-blocked. */
export function ProductImage({
  src,
  alt = "",
  className,
  loading = "lazy",
  decoding = "async",
  style,
}: ProductImageProps) {
  const [current, setCurrent] = useState(src || FALLBACK);

  useEffect(() => {
    setCurrent(src || FALLBACK);
  }, [src]);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      style={style}
      referrerPolicy="no-referrer"
      onError={() => {
        if (current !== FALLBACK) setCurrent(FALLBACK);
      }}
    />
  );
}
