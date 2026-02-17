import { NextRequest, NextResponse } from "next/server";

import { createProduct, listProducts } from "@/server/products";
import { productInputSchema } from "@/server/validation";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = params.get("search") ?? params.get("q") ?? undefined;
  const limit = params.get("limit");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const sortParam = params.get("sort");

  const data = await listProducts({
    search,
    sort: sortParam as any,
    limit: limit ? Number(limit) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = productInputSchema.parse(payload);
    const product = await createProduct(parsed);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create product" },
      { status: 400 }
    );
  }
}

