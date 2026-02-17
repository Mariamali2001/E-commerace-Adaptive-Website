import "server-only";

import connectDB from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import { products as seedProductsData } from "@/data/products";
import { Product } from "@/types/product";

export type ProductInput = Omit<Product, "id" | "slug"> & { id?: string; slug?: string };

export type ProductFilters = {
  search?: string;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price-asc" | "price-desc" | "rating" | "title";
};

// Seed products on first load
let seeded = false;
async function seedProducts() {
  if (seeded) return;
  
  await connectDB();
  
  const count = await ProductModel.countDocuments();
  if (count === 0) {
    // Only seed if database is empty
    // Don't set _id, let MongoDB generate it automatically
    await ProductModel.insertMany(
      seedProductsData.map((p: Product) => {
        const { id, ...rest } = p; // Remove the id field
        return rest;
      })
    );
    console.log("✅ Seeded initial products");
  }
  seeded = true;
}

function convertToProduct(doc: any): Product {
  return {
    id: doc._id?.toString() || doc.id,
    slug: doc.slug,
    title: doc.title,
    price: doc.price,
    compareAt: doc.compareAt,
    rating: doc.rating,
    images: doc.images,
    colors: doc.colors,
    sizes: doc.sizes,
    description: doc.description,
    details: doc.details,
    category: doc.category,
    brand: doc.brand,
  };
}

export async function listProducts(filters: ProductFilters = {}) {
  await connectDB();
  await seedProducts();
  
  const { search, limit, minPrice, maxPrice, sort } = filters;
  
  // Build MongoDB query
  const query: any = {};
  
  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
      { category: { $regex: search.trim(), $options: "i" } },
      { brand: { $regex: search.trim(), $options: "i" } },
    ];
  }
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }
  
  // Build sort option
  let sortOption: any = {};
  switch (sort) {
    case "price-asc":
      sortOption = { price: 1 };
      break;
    case "price-desc":
      sortOption = { price: -1 };
      break;
    case "rating":
      sortOption = { rating: -1 };
      break;
    case "title":
      sortOption = { title: 1 };
      break;
    default:
      sortOption = { rating: -1 }; // Default to popular (by rating)
  }
  
  const products = await ProductModel.find(query)
    .sort(sortOption)
    .limit(limit || 0);
  
  return products.map(convertToProduct);
}

export async function getProductBySlug(slug: string) {
  await connectDB();
  await seedProducts();
  
  const product = await ProductModel.findOne({ slug });
  return product ? convertToProduct(product) : null;
}

export async function getProductById(id: string) {
  await connectDB();
  await seedProducts();
  
  const product = await ProductModel.findById(id);
  return product ? convertToProduct(product) : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createProduct(input: ProductInput) {
  await connectDB();
  
  const baseSlug = input.slug ? input.slug : slugify(input.title);
  const slug = slugify(baseSlug);
  
  // Check if slug already exists
  const existing = await ProductModel.findOne({ slug });
  if (existing) {
    throw new Error("Product slug already exists");
  }

  // Don't set _id, let MongoDB generate it
  const product = await ProductModel.create({
    slug,
    title: input.title,
    price: input.price,
    compareAt: input.compareAt,
    rating: input.rating,
    images: input.images,
    colors: input.colors,
    sizes: input.sizes,
    description: input.description,
    details: input.details,
    category: input.category,
    brand: input.brand,
  });

  return convertToProduct(product);
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "slug">> & { slug?: string }
) {
  await connectDB();
  
  const existing = await ProductModel.findById(id);
  if (!existing) {
    return null;
  }

  if (updates.slug && updates.slug !== existing.slug) {
    const normalizedSlug = slugify(updates.slug);
    const slugExists = await ProductModel.findOne({ slug: normalizedSlug });
    if (slugExists) {
      throw new Error("Product slug already exists");
    }
    existing.slug = normalizedSlug;
  }

  // Update fields
  Object.assign(existing, updates);
  await existing.save();

  return convertToProduct(existing);
}

export async function deleteProduct(id: string) {
  await connectDB();
  
  const result = await ProductModel.findByIdAndDelete(id);
  return !!result;
}

