import { NextRequest, NextResponse } from "next/server";

import { createPasswordResetToken } from "@/server/users";
import { passwordResetRequestSchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = passwordResetRequestSchema.parse(payload);
    
    const token = await createPasswordResetToken(parsed.email);
    
    // Always return success to prevent email enumeration attacks
    // In production, you would send an email with the reset link
    if (token) {
      // TODO: Send email with reset link
      // await sendPasswordResetEmail(parsed.email, token);
      console.log(`Password reset token for ${parsed.email}: ${token}`);
      console.log(`Reset link: http://localhost:3000/shop/auth/reset-password?token=${token}`);
    }
    
    return NextResponse.json({
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process request" },
      { status: 400 }
    );
  }
}

