"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccessClaim() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { error?: string; ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Could not verify your purchase");
      }

      setMessage(payload.message || "Access granted. Redirecting...");
      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify your purchase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-[#111720] p-4">
      <h3 className="text-sm font-semibold text-slate-100">Already purchased?</h3>
      <p className="text-xs text-slate-400">
        Enter the same billing email from Stripe checkout to unlock your dashboard.
      </p>
      <Input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button onClick={submit} disabled={!email || loading} className="w-full">
        {loading ? "Verifying..." : "Unlock Dashboard"}
      </Button>
      {message && <p className="text-xs text-emerald-300">{message}</p>}
      {error && <p className="text-xs text-amber-300">{error}</p>}
    </div>
  );
}
