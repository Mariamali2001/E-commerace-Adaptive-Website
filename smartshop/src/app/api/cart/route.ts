import { NextRequest, NextResponse } from "next/server";

import { addToCart, clearCart, getCart } from "@/server/cart";
import { ensureCookieId } from "@/server/cookie-ids";
import { cartAddSchema } from "@/server/validation";

const CART_COOKIE = "smartshop_cart";

async function getCartId() {
  return ensureCookieId({ cookieName: CART_COOKIE });
}

export async function GET() {
  const cartId = await getCartId();
  const data = await getCart(cartId);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = cartAddSchema.parse(payload);
    const cartId = await getCartId();
    const data = await addToCart(cartId, parsed);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update cart" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const cartId = await getCartId();
  const data = await clearCart(cartId);
  return NextResponse.json({ data });
}

