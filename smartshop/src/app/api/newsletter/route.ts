import { NextResponse } from "next/server";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({}));

  if (typeof email !== "string" || !emailRegex.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  // Simulate latency to mimic a real call to a provider like Mailchimp.
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json({ success: true });
}

