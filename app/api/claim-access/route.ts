import { NextResponse } from "next/server";
import { z } from "zod";
import { accessCookieOptions, createAccessCookie } from "@/lib/auth";
import { getPurchaseRecord } from "@/lib/database";

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Provide a valid purchase email address"
      },
      { status: 400 }
    );
  }

  const purchase = await getPurchaseRecord(parsed.data.email);
  if (!purchase || purchase.status !== "active") {
    return NextResponse.json(
      {
        error:
          "No active purchase found for this email yet. If checkout finished recently, wait a few seconds and try again."
      },
      { status: 404 }
    );
  }

  const cookieValue = createAccessCookie(parsed.data.email);
  const response = NextResponse.json({ ok: true, dashboardUrl: "/dashboard" });
  response.cookies.set({
    ...accessCookieOptions(),
    value: cookieValue
  });

  return response;
}
