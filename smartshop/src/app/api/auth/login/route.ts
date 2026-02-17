import { NextRequest, NextResponse } from "next/server";

import { createSession, getSessionCookieOptions, SESSION_COOKIE_NAME, getClientInfo } from "@/server/session";
import { verifyUser } from "@/server/users";
import { loginSchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = loginSchema.parse(payload);
    const user = await verifyUser(parsed.email, parsed.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    // Get client info for tracking
    const { ipAddress, userAgent } = getClientInfo(request);
    
    // Create session with Remember Me support
    const { sessionId, maxAge } = await createSession(user.id, {
      remember: parsed.remember,
      ipAddress,
      userAgent,
    });
    
    const response = NextResponse.json({ data: user });
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions(maxAge));
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to log in" },
      { status: 400 }
    );
  }
}

