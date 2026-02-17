import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";
import { pbkdf2Sync } from "node:crypto";

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, 1_000, 64, "sha512").toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const dbUser = await UserModel.findById(user.id);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const currentHash = hashPassword(currentPassword, dbUser.salt);
    if (currentHash !== dbUser.passwordHash) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    // Hash new password
    const newHash = hashPassword(newPassword, dbUser.salt);
    dbUser.passwordHash = newHash;
    await dbUser.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to change password" },
      { status: 500 }
    );
  }
}

