import "server-only";

import connectDB from "@/lib/mongodb";
import CartModel from "@/models/Cart";

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  qty: number;
  size?: string;
  color?: string;
};

export type CartLineInput = Omit<CartLine, "key" | "qty"> & {
  qty?: number;
  key?: string;
};

function clampQty(value: number) {
  return Math.max(1, Math.min(99, value));
}

function buildKey(input: CartLineInput) {
  if (input.key) return input.key;
  return [input.productId, input.size ?? "", input.color ?? ""]
    .filter(Boolean)
    .join("|");
}

async function getOrCreateCart(cartId: string) {
  await connectDB();
  
  let cart = await CartModel.findById(cartId);
  if (!cart) {
    cart = await CartModel.create({
      _id: cartId,
      lines: [],
    });
  }
  return cart;
}

export async function getCart(cartId: string) {
  const cart = await getOrCreateCart(cartId);
  const list = cart.lines.map((line: any) => ({
    key: line.key,
    productId: line.productId,
    slug: line.slug,
    title: line.title,
    price: line.price,
    image: line.image,
    qty: line.qty,
    size: line.size,
    color: line.color,
  }));
  
  return {
    list,
    subtotal: list.reduce((sum, line) => sum + line.price * line.qty, 0),
  };
}

export async function addToCart(cartId: string, input: CartLineInput) {
  const cart = await getOrCreateCart(cartId);
  const qty = clampQty(input.qty ?? 1);
  const key = buildKey(input);
  
  const idx = cart.lines.findIndex((line: any) => line.key === key);
  
  if (idx >= 0) {
    const existing = cart.lines[idx];
    cart.lines[idx] = { ...existing, qty: clampQty(existing.qty + qty) };
  } else {
    cart.lines.push({
      key,
      productId: input.productId,
      slug: input.slug,
      title: input.title,
      price: input.price,
      image: input.image,
      qty,
      size: input.size,
      color: input.color,
    });
  }
  
  cart.updatedAt = new Date();
  await cart.save();
  
  return getCart(cartId);
}

export async function setCartQuantity(cartId: string, key: string, qty: number) {
  const cart = await getOrCreateCart(cartId);
  
  cart.lines = cart.lines.map((line: any) =>
    line.key === key ? { ...line, qty: clampQty(qty) } : line
  );
  
  cart.updatedAt = new Date();
  await cart.save();
  
  return getCart(cartId);
}

export async function removeFromCart(cartId: string, key: string) {
  const cart = await getOrCreateCart(cartId);
  
  cart.lines = cart.lines.filter((line: any) => line.key !== key);
  
  cart.updatedAt = new Date();
  await cart.save();
  
  return getCart(cartId);
}

export async function clearCart(cartId: string) {
  await connectDB();
  
  await CartModel.findByIdAndDelete(cartId);
  
  return { list: [], subtotal: 0 };
}

