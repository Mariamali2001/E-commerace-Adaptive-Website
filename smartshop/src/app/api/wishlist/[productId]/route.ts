import { NextResponse } from "next/server";

import { ensureCookieId } from "@/server/cookie-ids";
import { removeFromWishlist } from "@/server/wishlist";

const WISHLIST_COOKIE = "smartshop_wishlist";

async function getKey() {
  return ensureCookieId({ cookieName: WISHLIST_COOKIE, maxAge: 60 * 60 * 24 * 90 });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const key = await getKey();
  const data = await removeFromWishlist(key, productId);
  return NextResponse.json({ data });
}
