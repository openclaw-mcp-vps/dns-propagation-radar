"use client";

import { useState } from "react";
import { BellRing, LoaderCircle } from "lucide-react";

interface NotificationSettingsProps {
  monitorId: string;
}

export function NotificationSettings({ monitorId }: NotificationSettingsProps) {
  const [email, setEmail] = useState("");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [thresholdPercent, setThresholdPercent] = useState(95);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          monitorId,
          email: email.trim() || undefined,
          discordWebhookUrl: discordWebhookUrl.trim() || undefined,
          thresholdPercent
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save notification settings.");
      }

      setStatus("Alert settings saved. You will be notified once your threshold is reached.");
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("Unexpected error while creating the alert.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex items-center gap-2 text-zinc-100">
        <BellRing className="size-4 text-cyan-300" />
        <h3 className="text-sm font-semibold uppercase tracking-wide">Notification Settings</h3>
      </div>
      <p className="mt-2 text-sm text-zinc-400">
        Receive a ping when this monitor reaches your propagation threshold.
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-zinc-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="oncall@company.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/40 transition focus:ring"
            />
          </label>

          <label className="space-y-1 text-sm text-zinc-300">
            Discord Webhook URL
            <input
              type="url"
              value={discordWebhookUrl}
              onChange={(event) => setDiscordWebhookUrl(event.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/40 transition focus:ring"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm text-zinc-300">
          Threshold: {thresholdPercent}%
          <input
            type="range"
            min={50}
            max={100}
            value={thresholdPercent}
            onChange={(event) => setThresholdPercent(Number(event.target.value))}
            className="w-full accent-cyan-300"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Save Alert
        </button>

        {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </form>
    </section>
  );
}
