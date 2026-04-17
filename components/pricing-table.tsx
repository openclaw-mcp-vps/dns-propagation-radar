"use client";

import Script from "next/script";
import { useMemo, useState } from "react";

const CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
  ? `https://app.lemonsqueezy.com/checkout/buy/${process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID}`
  : "";

export function PricingTable() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canPay = useMemo(() => CHECKOUT_URL.length > 0, []);

  const unlockAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const payload = (await response.json()) as { message?: string; error?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Could not unlock access.");
      return;
    }

    setMessage(payload.message ?? "Access granted. Opening dashboard...");
    window.location.href = "/dashboard";
  };

  return (
    <>
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
      <section id="pricing" className="panel p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-white">Simple Pricing</h3>
          <p className="mt-2 text-sm text-slate-300">
            One plan for migration weeks. Start checks instantly and keep historical runs for postmortems.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-6">
          <p className="text-sm text-emerald-300">DNS Propagation Radar Pro</p>
          <p className="mt-2 text-4xl font-bold text-white">$12<span className="text-lg text-slate-400">/mo</span></p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li>40 global resolvers polled every 60 seconds</li>
            <li>Live world map and resolver-by-resolver timeline</li>
            <li>Email alerts at 95% propagation</li>
            <li>Discord webhook alerts for incident channels</li>
          </ul>
          <a
            href={canPay ? CHECKOUT_URL : "#"}
            className={`lemonsqueezy-button mt-6 block w-full rounded-md px-4 py-3 text-center text-sm font-semibold transition ${
              canPay
                ? "bg-emerald-500 text-black hover:bg-emerald-400"
                : "cursor-not-allowed bg-slate-700 text-slate-300 opacity-50"
            }`}
            onClick={(event) => {
              if (!canPay) event.preventDefault();
            }}
          >
            Start Subscription
          </a>
          {!canPay ? (
            <p className="mt-3 text-xs text-amber-300">
              Set `NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID` to enable checkout.
            </p>
          ) : null}
        </div>

        <form onSubmit={unlockAccess} className="mt-6 space-y-3 rounded-xl border border-slate-700 p-4">
          <p className="text-sm text-slate-200">Already purchased? Unlock dashboard access.</p>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            placeholder="billing-email@yourcompany.com"
            className="w-full rounded-md border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-white transition hover:border-slate-400"
          >
            {loading ? "Checking purchase..." : "Unlock My Access"}
          </button>
          {message ? <p className="text-xs text-slate-300">{message}</p> : null}
        </form>
      </section>
    </>
  );
}
