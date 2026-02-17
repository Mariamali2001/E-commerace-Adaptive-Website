import { NextRequest, NextResponse } from "next/server";

import { ensureCookieId } from "@/server/cookie-ids";
import { addToWishlist, getWishlist } from "@/server/wishlist";

const WISHLIST_COOKIE = "smartshop_wishlist";

async function getKey() {
  return ensureCookieId({ cookieName: WISHLIST_COOKIE, maxAge: 60 * 60 * 24 * 90 });
}

export async function GET() {
  const key = await getKey();
  const data = await getWishlist(key);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (!payload?.productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }
  const key = await getKey();
  const data = await addToWishlist(key, payload.productId);
  return NextResponse.json({ data });
}

