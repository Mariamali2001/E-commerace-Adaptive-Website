import { NextRequest, NextResponse } from "next/server";

import { getProductBySlug } from "@/server/products";
import { createReview, listReviews } from "@/server/reviews";
import { reviewInputSchema } from "@/server/validation";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const data = await listReviews(product.id);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const payload = await request.json();
    const parsed = reviewInputSchema.parse({
      ...payload,
      productId: product.id,
    });
    const review = await createReview(parsed);
    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create review" },
      { status: 400 }
    );
  }
}

