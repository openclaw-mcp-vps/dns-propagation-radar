import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { upsertPurchaseRecord } from "@/lib/database";

export const runtime = "nodejs";

function parseStripeSignatureHeader(signatureHeader: string): {
  timestamp: string;
  signatures: string[];
} | null {
  const entries = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = entries.find((entry) => entry.startsWith("t="))?.slice(2);
  const signatures = entries
    .filter((entry) => entry.startsWith("v1="))
    .map((entry) => entry.slice(3));

  if (!timestamp || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const parsed = parseStripeSignatureHeader(signatureHeader);
  if (!parsed) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  return parsed.signatures.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  });
}

type StripeCheckoutSession = {
  id?: string;
  customer?: string;
  customer_email?: string;
  customer_details?: {
    email?: string;
  };
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: StripeCheckoutSession;
  };
};

export async function POST(request: Request) {
  const payload = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      {
        error: "STRIPE_WEBHOOK_SECRET is not configured"
      },
      { status: 500 }
    );
  }

  if (!signatureHeader || !verifyStripeSignature(payload, signatureHeader, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const email = session?.customer_details?.email ?? session?.customer_email;

    if (email) {
      await upsertPurchaseRecord({
        email,
        stripeCustomerId: session?.customer,
        stripeSessionId: session?.id
      });
    }
  }

  return NextResponse.json({ received: true });
}
