import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

type Options = {
  cookieName: string;
  maxAge?: number;
};

export async function ensureCookieId({ cookieName, maxAge = 60 * 60 * 24 * 30 }: Options) {
  const store = await cookies();
  const existing = store.get(cookieName)?.value;
  if (existing) return existing;
  const id = randomUUID();
  store.set(cookieName, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  return id;
}

export async function getCookieId(cookieName: string) {
  const store = await cookies();
  return store.get(cookieName)?.value ?? null;
}

