import "server-only";

import connectDB from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import {
  products as seedProductsData,
  CATALOG_VERSION,
} from "@/data/products";
import { Product } from "@/types/product";

export type ProductInput = Omit<Product, "id" | "slug"> & { id?: string; slug?: string };

export type ProductFilters = {
  search?: string;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price-asc" | "price-desc" | "rating" | "title";
};

type SeedCache = {
  done: boolean;
  version: string | null;
  promise: Promise<void> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __smartshopProductSeed: SeedCache | undefined;
}

const seedCache: SeedCache = global.__smartshopProductSeed ?? {
  done: false,
  version: null,
  promise: null,
};
if (!global.__smartshopProductSeed) {
  global.__smartshopProductSeed = seedCache;
}

/**
 * Sync catalog from src/data/products.ts into Mongo.
 * Upserts by slug (title/images/category/etc.) when CATALOG_VERSION changes.
 */
async function seedProducts() {
  if (seedCache.done && seedCache.version === CATALOG_VERSION) return;
  if (seedCache.promise) {
    await seedCache.promise;
    return;
  }

  seedCache.promise = (async () => {
    await connectDB();

    const slugs = seedProductsData.map((p) => p.slug).filter(Boolean);
    const ops = seedProductsData.map((p: Product) => {
      const { id: _id, ...rest } = p;
      return {
        updateOne: {
          filter: { slug: rest.slug },
          update: { $set: rest },
          upsert: true,
        },
      };
    });

    if (ops.length) {
      await ProductModel.bulkWrite(ops, { ordered: false });
    }
    if (slugs.length) {
      await ProductModel.deleteMany({ slug: { $nin: slugs } });
    }

    console.log(
      `✅ Catalog synced (${CATALOG_VERSION}): ${seedProductsData.length} products`
    );
    seedCache.done = true;
    seedCache.version = CATALOG_VERSION;
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
    // Whole-word match on title/brand/category/slug — not description
    // (avoids "rings" matching "earrings" / "fitness rings")
    const terms = search
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    query.$and = terms.map((term) => {
      const word = new RegExp(`\\b${term}\\b`, "i");
      return {
        $or: [
          { title: word },
          { brand: word },
          { category: word },
          { slug: word },
        ],
      };
    });
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

