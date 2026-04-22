import { NextResponse } from "next/server";
import { addAccessGrant } from "@/lib/database";
import {
  parseCheckoutEmail,
  parseStripeEvent,
  verifyStripeWebhookSignature
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const signatureHeader = request.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (secret) {
      if (!signatureHeader) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }

      const valid = verifyStripeWebhookSignature(rawBody, signatureHeader, secret);
      if (!valid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = parseStripeEvent(rawBody);

    if (event.type === "checkout.session.completed") {
      const email = parseCheckoutEmail(event);
      if (!email) {
        return NextResponse.json({ error: "No customer email in checkout session" }, { status: 400 });
      }

      await addAccessGrant({
        email,
        grantedAt: new Date().toISOString(),
        source: "stripe-webhook",
        reference: event.id
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    description:
      "Send Stripe checkout.session.completed events here to grant dashboard access by billing email."
  });
}
