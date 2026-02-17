import { NextRequest, NextResponse } from "next/server";

import { removeFromCart, setCartQuantity } from "@/server/cart";
import { ensureCookieId } from "@/server/cookie-ids";

const CART_COOKIE = "smartshop_cart";

async function getCartId() {
  return ensureCookieId({ cookieName: CART_COOKIE });
}

export async function PATCH(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const body = await request.json();
    const qty = Number(body.qty);
    if (!Number.isInteger(qty)) {
      return NextResponse.json({ error: "Quantity must be an integer" }, { status: 400 });
    }
    const cartId = await getCartId();
    const data = await setCartQuantity(cartId, decodeURIComponent(params.key), qty);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update line" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { key: string } }) {
  const cartId = await getCartId();
  const data = await removeFromCart(cartId, decodeURIComponent(params.key));
  return NextResponse.json({ data });
}

