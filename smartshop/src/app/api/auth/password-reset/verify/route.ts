import { NextRequest, NextResponse } from "next/server";

import { resetPassword } from "@/server/users";
import { passwordResetVerifySchema } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = passwordResetVerifySchema.parse(payload);
    
    const success = await resetPassword(parsed.token, parsed.newPassword);
    
    if (!success) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: "Password successfully reset. You can now login with your new password.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reset password" },
      { status: 400 }
    );
  }
}

