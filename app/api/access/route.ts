import { NextResponse } from "next/server";
import { z } from "zod";
import { hasPaidEmail } from "@/lib/storage";

const accessSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = accessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const isPaid = await hasPaidEmail(email);

  if (!isPaid) {
    return NextResponse.json(
      {
        error:
          "No paid subscription found for this email yet. Complete checkout first or confirm webhook delivery."
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ message: "Access granted." });
  response.cookies.set("dpr_access", "active", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
