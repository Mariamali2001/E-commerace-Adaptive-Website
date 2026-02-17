import "server-only";

import connectDB from "@/lib/mongodb";
import WishlistModel from "@/models/Wishlist";
import { getProductById } from "@/server/products";

async function getOrCreateWishlist(userKey: string) {
  await connectDB();
  
  let wishlist = await WishlistModel.findById(userKey);
  if (!wishlist) {
    wishlist = await WishlistModel.create({
      _id: userKey,
      productIds: [],
    });
  }
  return wishlist;
}

export async function getWishlist(userKey: string) {
  const wishlist = await getOrCreateWishlist(userKey);
  const products = await Promise.all(
    wishlist.productIds.map((id: string) => getProductById(id))
  );
  return products.filter(Boolean);
}

export async function addToWishlist(userKey: string, productId: string) {
  const wishlist = await getOrCreateWishlist(userKey);
  
  if (!wishlist.productIds.includes(productId)) {
    wishlist.productIds.push(productId);
    wishlist.updatedAt = new Date();
    await wishlist.save();
  }
  
  return getWishlist(userKey);
}

export async function removeFromWishlist(userKey: string, productId: string) {
  const wishlist = await getOrCreateWishlist(userKey);
  
  wishlist.productIds = wishlist.productIds.filter((id: string) => id !== productId);
  wishlist.updatedAt = new Date();
  await wishlist.save();
  
  return getWishlist(userKey);
}

export async function clearWishlist(userKey: string) {
  await connectDB();
  
  await WishlistModel.findByIdAndDelete(userKey);
  
  return [];
}

