import { z } from "zod";

export const productInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  price: z.number().positive(),
  compareAt: z.number().positive().optional(),
  rating: z.number().min(0).max(5),
  images: z.array(z.string().min(1)).nonempty(),
  colors: z.array(z.string().min(1)).nonempty(),
  sizes: z.array(z.string().min(1)).nonempty(),
  description: z.string().min(1),
  details: z.string().optional(),
});

export const reviewInputSchema = z.object({
  productId: z.string().min(1),
  author: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(3),
});

export const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  age: z.coerce.number().int().min(13).max(120),
  gender: z.enum(["Female", "Male", "Non-binary", "Prefer not to say", "Other"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional().default(false),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetVerifySchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export const cartAddSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  price: z.number().positive(),
  image: z.string().min(1),
  qty: z.number().int().min(1).max(99).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  key: z.string().optional(),
});

