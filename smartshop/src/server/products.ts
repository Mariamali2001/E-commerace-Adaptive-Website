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

type SeedCache = { done: boolean; promise: Promise<void> | null };

declare global {
  // eslint-disable-next-line no-var
  var __smartshopProductSeed: SeedCache | undefined;
}

const seedCache: SeedCache = global.__smartshopProductSeed ?? {
  done: false,
  promise: null,
};
if (!global.__smartshopProductSeed) {
  global.__smartshopProductSeed = seedCache;
}

/** One-shot catalog sync — no N+1 findOne loop (was a major cold-path cost). */
async function seedProducts() {
  if (seedCache.done) return;
  if (seedCache.promise) {
    await seedCache.promise;
    return;
  }

  seedCache.promise = (async () => {
    await connectDB();

    const count = await ProductModel.countDocuments();
    if (count === 0) {
      await ProductModel.insertMany(
        seedProductsData.map((p: Product) => {
          const { id, ...rest } = p;
          return rest;
        })
      );
      console.log(`✅ Seeded ${seedProductsData.length} products`);
    } else {
      const existing = await ProductModel.find({}, { slug: 1 }).lean();
      const have = new Set(
        existing.map((d) => (d as { slug?: string }).slug).filter(Boolean)
      );
      const missing = seedProductsData
        .filter((p) => p.slug && !have.has(p.slug))
        .map(({ id, ...rest }) => rest);
      if (missing.length > 0) {
        await ProductModel.insertMany(missing);
        console.log(`✅ Added ${missing.length} new catalog products`);
      }
    }
    seedCache.done = true;
  })();

  try {
    await seedCache.promise;
  } catch (e) {
    seedCache.promise = null;
    throw e;
  }
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
      sortOption = { rating: -1 };
  }

  const products = await ProductModel.find(query)
    .sort(sortOption)
    .limit(limit || 0)
    .lean();

  return products.map(convertToProduct);
}

export async function getProductBySlug(slug: string) {
  await connectDB();
  await seedProducts();

  const product = await ProductModel.findOne({ slug }).lean();
  return product ? convertToProduct(product) : null;
}

export async function getProductById(id: string) {
  await connectDB();
  await seedProducts();

  const product = await ProductModel.findById(id).lean();
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

  const existing = await ProductModel.findOne({ slug }).lean();
  if (existing) {
    throw new Error("Product slug already exists");
  }

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

  Object.assign(existing, updates);
  await existing.save();

  return convertToProduct(existing);
}

export async function deleteProduct(id: string) {
  await connectDB();

  const result = await ProductModel.findByIdAndDelete(id);
  return !!result;
}

