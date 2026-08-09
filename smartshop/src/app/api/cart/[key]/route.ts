import { NextRequest, NextResponse } from "next/server";

import { removeFromCart, setCartQuantity } from "@/server/cart";
import { ensureCookieId } from "@/server/cookie-ids";

const CART_COOKIE = "smartshop_cart";

async function getCartId() {
  return ensureCookieId({ cookieName: CART_COOKIE });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();
    const qty = Number(body.qty);
    if (!Number.isInteger(qty)) {
      return NextResponse.json({ error: "Quantity must be an integer" }, { status: 400 });
    }
    const cartId = await getCartId();
    const data = await setCartQuantity(cartId, decodeURIComponent(key), qty);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update line" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const cartId = await getCartId();
  const data = await removeFromCart(cartId, decodeURIComponent(key));
  return NextResponse.json({ data });
}
