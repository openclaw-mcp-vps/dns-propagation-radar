import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy";
import { addPaidEmail } from "@/lib/storage";

export const runtime = "nodejs";

const webhookSchema = z.object({
  meta: z
    .object({
      event_name: z.string().optional()
    })
    .optional(),
  data: z
    .object({
      attributes: z
        .object({
          user_email: z.string().email().optional(),
          customer_email: z.string().email().optional()
        })
        .optional()
    })
    .optional()
});

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const email =
    parsed.data.data?.attributes?.user_email ??
    parsed.data.data?.attributes?.customer_email ??
    null;

  if (email) {
    await addPaidEmail(email.toLowerCase());
  }

  return NextResponse.json({ received: true });
}
