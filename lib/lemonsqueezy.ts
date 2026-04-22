import crypto from "node:crypto";

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: {
      id?: string;
      customer_email?: string;
      customer_details?: {
        email?: string;
      };
      metadata?: {
        email?: string;
      };
    };
  };
};

function secureCompare(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const sentSignature = parts.find((part) => part.startsWith("v1="))?.slice(3);

  if (!timestamp || !sentSignature) {
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return secureCompare(sentSignature, expectedSignature);
}

export function parseCheckoutEmail(event: StripeEvent) {
  const object = event.data?.object;
  return (
    object?.customer_email || object?.customer_details?.email || object?.metadata?.email || ""
  )
    .trim()
    .toLowerCase();
}

export function parseStripeEvent(rawBody: string): StripeEvent {
  return JSON.parse(rawBody) as StripeEvent;
}
