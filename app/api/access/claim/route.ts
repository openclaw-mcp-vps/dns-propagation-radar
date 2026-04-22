import { NextResponse } from "next/server";
import { z } from "zod";
import { signAccessToken, ACCESS_COOKIE_NAME } from "@/lib/auth";
import { addAccessGrant, hasAccessGrant } from "@/lib/database";

const schema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { email } = schema.parse(json);

    let hasAccess = await hasAccessGrant(email);
    if (!hasAccess && process.env.NODE_ENV !== "production" && !process.env.STRIPE_WEBHOOK_SECRET) {
      await addAccessGrant({
        email,
        grantedAt: new Date().toISOString(),
        source: "manual",
        reference: "local-dev-mode"
      });
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({
        ok: false,
        error:
          "No completed purchase found for that email yet. If you just paid, webhook processing can take a minute."
      }, { status: 403 });
    }

    const token = await signAccessToken(email);
    const response = NextResponse.json({
      ok: true,
      message: "Access granted. Redirecting to dashboard."
    });

    response.cookies.set(ACCESS_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid request"
      },
      { status: 400 }
    );
  }
}
