import { Resend } from "resend";
import type { DnsCheckSession } from "@/lib/storage";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPropagationNotifications(check: DnsCheckSession) {
  if (!check.notifications) return;

  const summary = `${check.domain} ${check.recordType} is now ${check.propagationPercent.toFixed(1)}% propagated.`;

  if (check.notifications.email && resend) {
    await resend.emails.send({
      from: process.env.NOTIFICATION_FROM_EMAIL ?? "alerts@dns-propagation-radar.dev",
      to: check.notifications.email,
      subject: `DNS propagation reached ${Math.round(check.propagationPercent)}%`,
      text: `${summary}\nExpected: ${check.expectedValue}\nCheck ID: ${check.id}`
    });
  }

  if (check.notifications.discordWebhookUrl) {
    await fetch(check.notifications.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `DNS Propagation Radar\n${summary}\nExpected: ${check.expectedValue}\nCheck ID: ${check.id}`
      })
    });
  }
}
