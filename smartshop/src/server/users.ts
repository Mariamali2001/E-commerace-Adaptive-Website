import "server-only";

import { randomBytes, pbkdf2Sync } from "node:crypto";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";
import PasswordResetModel from "@/models/PasswordReset";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  age?: number | null;
  gender?: string | null;
  createdAt: string;
};

export type PublicUser = Omit<User, "passwordHash" | "salt">;

type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  age: number;
  gender: string;
};

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 1_000, 64, "sha512").toString("hex");
  return { hash, salt };
}

function toPublicUser(user: any): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    age: user.age ?? null,
    gender: user.gender ?? null,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
  };
}

export async function createUser(input: CreateUserInput) {
  await connectDB();
  
  const normalizedEmail = input.email.trim().toLowerCase();
  
  // Check if user already exists
  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error("Email already registered");
  }
  
  const { hash, salt } = hashPassword(input.password);
  
  const user = await UserModel.create({
    email: normalizedEmail,
    name: input.name.trim(),
    passwordHash: hash,
    salt,
    age: input.age,
    gender: input.gender,
  });

  return toPublicUser(user);
}

export async function verifyUser(email: string, password: string) {
  await connectDB();
  
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  
  if (!user) return null;
  
  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return null;
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  return toPublicUser(user);
}

export async function getUserById(id: string) {
  await connectDB();
  
  const user = await UserModel.findById(id);
  return user ? toPublicUser(user) : null;
}

export async function getUserByEmail(email: string) {
  await connectDB();
  
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  return user ? toPublicUser(user) : null;
}

// Password Reset Functions
export async function createPasswordResetToken(email: string): Promise<string | null> {
  await connectDB();
  
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  
  if (!user) return null;
  
  // Generate secure random token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  await PasswordResetModel.create({
    _id: token,
    userId: user._id.toString(),
    email: normalizedEmail,
    expiresAt,
    used: false,
  });
  
  return token;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  await connectDB();
  
  const resetRequest = await PasswordResetModel.findById(token);
  
  if (!resetRequest) return false;
  if (resetRequest.used) return false;
  if (resetRequest.expiresAt < new Date()) return false;
  
  // Hash new password
  const { hash, salt } = hashPassword(newPassword);
  
  // Update user password
  await UserModel.findByIdAndUpdate(resetRequest.userId, {
    passwordHash: hash,
    salt,
  });
  
  // Mark token as used
  resetRequest.used = true;
  await resetRequest.save();
  
  // Invalidate all existing sessions for this user (security best practice)
  const SessionModel = (await import("@/models/Session")).default;
  await SessionModel.deleteMany({ userId: resetRequest.userId });
  
  return true;
}

// Seed demo account on startup
(async () => {
  try {
    await createUser({ email: "demo@smartshop.dev", name: "Demo User", password: "demo1234" });
  } catch (error) {
    // Ignore if already exists
  }
})();

