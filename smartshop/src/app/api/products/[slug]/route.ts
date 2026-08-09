import { NextRequest, NextResponse } from "next/server";

import { deleteProduct, getProductBySlug, updateProduct } from "@/server/products";
import { productInputSchema } from "@/server/validation";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ data: product });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const existing = await getProductBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const payload = await request.json();
    const parsed = productInputSchema.partial().parse(payload);
    const updated = await updateProduct(existing.id, parsed);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update product" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const existing = await getProductBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  await deleteProduct(existing.id);
  return NextResponse.json({ success: true });
}
