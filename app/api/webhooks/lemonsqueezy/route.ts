import { NextRequest, NextResponse } from "next/server";
import { addPurchase } from "@/lib/database";
import {
  extractCheckoutEmail,
  extractCheckoutReference,
  verifyStripeSignature,
  type GenericWebhookEvent
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const validSignature = verifyStripeSignature({
    payload,
    signatureHeader,
    secret: webhookSecret
  });

  if (!validSignature) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  let event: GenericWebhookEvent;

  try {
    event = JSON.parse(payload) as GenericWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const email = extractCheckoutEmail(event);
    const reference = extractCheckoutReference(event);

    if (email && reference) {
      await addPurchase({
        email,
        providerReference: reference
      });
    }
  }

  return NextResponse.json({ received: true });
}
