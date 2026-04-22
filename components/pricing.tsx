"use client";

import { useState } from "react";
import { CircleCheckBig, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const benefits = [
  "40+ resolvers across NA, EU, AP, SA, ME, and AF",
  "Fresh global checks every 60 seconds",
  "Live propagation map and resolver-by-resolver proof",
  "Alert when propagation crosses 95%",
  "DNS history snapshots to share with your team"
];

export function Pricing() {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  async function claimAccess() {
    setIsClaiming(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/claim-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { error?: string; dashboardUrl?: string };

      if (!response.ok) {
        setStatusMessage(payload.error ?? "Could not verify purchase yet.");
        return;
      }

      setStatusMessage("Access unlocked. Redirecting to dashboard...");
      window.location.href = payload.dashboardUrl ?? "/dashboard";
    } catch {
      setStatusMessage("Network error while unlocking access. Try again.");
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-[#0c1628]">
        <CardHeader>
          <CardTitle className="text-3xl text-white">$12/month</CardTitle>
          <CardDescription className="text-slate-300">
            One plan built for developers and ops teams shipping DNS changes under pressure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {benefits.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-200">
                <CircleCheckBig className="mt-0.5 h-4 w-4 text-cyan-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            href={paymentLink}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-cyan-400 px-4 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-300"
          >
            Buy DNS Propagation Radar
          </a>
          <p className="text-xs text-slate-400">
            Checkout uses Stripe hosted payment pages. After payment, return here and unlock with the same receipt email.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unlock Dashboard</CardTitle>
          <CardDescription>
            Enter the email used in Stripe checkout to activate your cookie-based access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purchase-email">Purchase email</Label>
            <Input
              id="purchase-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <Button onClick={claimAccess} disabled={isClaiming || !email.trim()} className="w-full">
            {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock paid access"}
          </Button>
          {statusMessage ? (
            <p className="rounded-md border border-slate-700 bg-[#0b1220] p-3 text-sm text-slate-300">
              {statusMessage}
            </p>
          ) : null}
          <p className="text-xs text-slate-400">
            Need custom invoicing for teams? Contact support@dns-propagation-radar.com and we will provision seats in bulk.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
