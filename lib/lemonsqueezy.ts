import { createHmac, timingSafeEqual } from "node:crypto";

export interface StripeSignatureParts {
  timestamp: string;
  signatures: string[];
}

export interface StripeCheckoutCompletedEvent {
  type: "checkout.session.completed";
  data: {
    object: {
      id: string;
      customer_email?: string;
      customer_details?: {
        email?: string;
      };
    };
  };
}

export interface GenericWebhookEvent {
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
}

export function parseStripeSignature(header: string): StripeSignatureParts | null {
  const parts = header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");

    if (!key || !value) {
      continue;
    }

    if (key === "t") {
      timestamp = value;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return null;
  }

  return {
    timestamp,
    signatures
  };
}

export function verifyStripeSignature(input: {
  payload: string;
  signatureHeader: string | null;
  secret: string | undefined;
}): boolean {
  const { payload, signatureHeader, secret } = input;

  if (!secret) {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const parsed = parseStripeSignature(signatureHeader);

  if (!parsed) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return parsed.signatures.some((signature) => {
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

export function extractCheckoutEmail(event: GenericWebhookEvent): string | null {
  if (event.type !== "checkout.session.completed") {
    return null;
  }

  const checkout = event as StripeCheckoutCompletedEvent;

  return checkout.data.object.customer_details?.email ?? checkout.data.object.customer_email ?? null;
}

export function extractCheckoutReference(event: GenericWebhookEvent): string | null {
  if (event.type !== "checkout.session.completed") {
    return null;
  }

  const checkout = event as StripeCheckoutCompletedEvent;
  return checkout.data.object.id;
}
