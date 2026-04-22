import crypto from "node:crypto";
import type { NextAuthConfig } from "next-auth";

export const ACCESS_COOKIE_NAME = "dnsr_access";

export const nextAuthConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/"
  }
};

export type AccessPayload = {
  email: string;
  issuedAt: string;
};

const secret = () =>
  process.env.ACCESS_COOKIE_SECRET ??
  process.env.STRIPE_WEBHOOK_SECRET ??
  "local-development-secret-change-me";

function base64urlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64urlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createAccessCookie(email: string): string {
  const payload: AccessPayload = {
    email: email.toLowerCase().trim(),
    issuedAt: new Date().toISOString()
  };
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessCookie(cookieValue: string | undefined | null): AccessPayload | null {
  if (!cookieValue) {
    return null;
  }

  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as AccessPayload;
    if (!payload.email || !payload.issuedAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function accessCookieOptions() {
  return {
    name: ACCESS_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 31
  };
}
