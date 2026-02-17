import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ data: null }, { status: 200 });
  }
  return NextResponse.json({ data: user });
}

