import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import { getUserById, PublicUser } from "@/server/users";
import connectDB from "@/lib/mongodb";
import SessionModel from "@/models/Session";

const AUTH_COOKIE = "smartshop_session";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (normal)
const AUTH_COOKIE_MAX_AGE_EXTENDED = 60 * 60 * 24 * 30; // 30 days (remember me)

export const SESSION_COOKIE_NAME = AUTH_COOKIE;

export async function getSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value ?? null;
}

export async function getSession(request?: Request): Promise<{ userId?: string; sessionId: string | null } | null> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { sessionId: null };
  }

  await connectDB();
  const session = await SessionModel.findById(sessionId);
  if (!session) {
    return { sessionId: null };
  }

  // Check if session expired
  if (session.expiresAt < new Date()) {
    await SessionModel.findByIdAndDelete(sessionId);
    return { sessionId: null };
  }

  return {
    userId: session.userId,
    sessionId: sessionId,
  };
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const sessionId = await getSessionId();
  if (!sessionId) return null;
  
  await connectDB();
  
  const session = await SessionModel.findById(sessionId);
  if (!session) return null;
  
  // Check if session expired
  if (session.expiresAt < new Date()) {
    await SessionModel.findByIdAndDelete(sessionId);
    return null;
  }
  
  return getUserById(session.userId);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function createSession(
  userId: string,
  options?: {
    remember?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  await connectDB();
  
  const sessionId = randomUUID();
  const maxAge = options?.remember ? AUTH_COOKIE_MAX_AGE_EXTENDED : AUTH_COOKIE_MAX_AGE;
  const expiresAt = new Date(Date.now() + maxAge * 1000);
  
  await SessionModel.create({
    _id: sessionId,
    userId,
    createdAt: new Date(),
    expiresAt,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
  
  return { sessionId, maxAge };
}

export async function deleteSession(sessionId: string | null) {
  if (!sessionId) return;
  
  await connectDB();
  await SessionModel.findByIdAndDelete(sessionId);
}

export function getSessionCookieOptions(maxAge: number = AUTH_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  };
}

export const sessionCookie = {
  name: AUTH_COOKIE,
  options: getSessionCookieOptions(),
} as const;

// Extract client info from request
export function getClientInfo(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0] : 
                    request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  return { ipAddress, userAgent };
}

