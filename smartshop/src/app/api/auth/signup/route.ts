import { NextRequest, NextResponse } from "next/server";

import { createSession, getSessionCookieOptions, SESSION_COOKIE_NAME, getClientInfo } from "@/server/session";
import { createUser } from "@/server/users";
import { signupSchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = signupSchema.parse(payload);
    const user = await createUser(parsed);
    
    // Get client info for tracking
    const { ipAddress, userAgent } = getClientInfo(request);
    
    // Auto-login after signup (default 7 days)
    const { sessionId, maxAge } = await createSession(user.id, {
      remember: false,
      ipAddress,
      userAgent,
    });
    
    const response = NextResponse.json({ data: user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions(maxAge));
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sign up" },
      { status: 400 }
    );
  }
}

