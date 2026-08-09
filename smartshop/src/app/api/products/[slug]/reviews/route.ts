import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

import { getProductBySlug } from "@/server/products";
import { createReview, listReviews } from "@/server/reviews";
import { reviewInputSchema } from "@/server/validation";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const data = await listReviews(product.id);
  return NextResponse.json({ data });
}

async function saveReviewImages(files: File[]): Promise<string[]> {
  if (!files.length) return [];

  // Vercel has no persistent disk — store small images inline in Mongo as data URLs.
  // Locally we still write under public/uploads/reviews for easier debugging.
  const useInline =
    process.env.VERCEL === "1" || process.env.REVIEW_IMAGES_INLINE === "1";

  const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
  if (!useInline) {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const urls: string[] = [];
  for (const file of files.slice(0, 3)) {
    if (!file.type.startsWith("image/")) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    // Cap uploads (tighter for data URLs in Mongo)
    const maxBytes = useInline ? 1.5 * 1024 * 1024 : 4 * 1024 * 1024;
    if (buffer.length > maxBytes) continue;

    if (useInline) {
      const mime = file.type || "image/jpeg";
      urls.push(`data:${mime};base64,${buffer.toString("base64")}`);
      continue;
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const abs = path.join(uploadDir, name);
    await fs.writeFile(abs, buffer);
    urls.push(`/uploads/reviews/${name}`);
  }
  return urls;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let author = "";
    let rating = 0;
    let comment = "";
    let images: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      author = String(form.get("author") ?? "");
      rating = Number(form.get("rating"));
      comment = String(form.get("comment") ?? "");
      const files = form
        .getAll("images")
        .filter((v): v is File => typeof v !== "string" && v instanceof File);
      images = await saveReviewImages(files);
    } else {
      const payload = await request.json();
      author = String(payload.author ?? "");
      rating = Number(payload.rating);
      comment = String(payload.comment ?? "");
      // Accept stored paths or compact data URLs from the client
      if (Array.isArray(payload.images)) {
        images = payload.images.filter((img: unknown) => {
          if (typeof img !== "string") return false;
          if (img.startsWith("/uploads/") && img.length < 500) return true;
          if (img.startsWith("data:image/") && img.length < 2_000_000) return true;
          return false;
        });
      }
    }

    const parsed = reviewInputSchema.parse({
      productId: product.id,
      author,
      rating,
      comment,
      images,
    });
    const review = await createReview(parsed);
    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create review" },
      { status: 400 }
    );
  }
}
