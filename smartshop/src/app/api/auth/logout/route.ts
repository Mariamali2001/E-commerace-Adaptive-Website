import { NextResponse } from "next/server";

import { deleteSession, getSessionId, getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/server/session";

export async function POST() {
  const sessionId = await getSessionId();
  deleteSession(sessionId);

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

