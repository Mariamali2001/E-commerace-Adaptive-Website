import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, bio, age, gender } = body;

    await connectDB();

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const update: Record<string, unknown> = {
      name: name || user.name,
      email: email ? email.toLowerCase() : user.email,
      phone,
      bio,
    };
    if (age != null && Number.isFinite(Number(age))) update.age = Number(age);
    if (typeof gender === "string" && gender.trim()) update.gender = gender.trim();

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      user.id,
      update,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        age: updatedUser.age ?? null,
        gender: updatedUser.gender ?? null,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}

