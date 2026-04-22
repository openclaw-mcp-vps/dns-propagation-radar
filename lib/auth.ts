import { jwtVerify, SignJWT } from "jose";
import { ACCESS_COOKIE_NAME } from "@/lib/constants";

function getJwtSecret() {
  return new TextEncoder().encode(
    process.env.STRIPE_WEBHOOK_SECRET || "local-dev-access-secret-change-me"
  );
}

export async function signAccessToken(email: string) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: email.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 24 * 30)
    .setIssuer("dns-propagation-radar")
    .setAudience("dashboard")
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "dns-propagation-radar",
      audience: "dashboard"
    });

    const email = payload.email;
    if (typeof email !== "string") {
      return null;
    }

    return { email };
  } catch {
    return null;
  }
}

export { ACCESS_COOKIE_NAME };
