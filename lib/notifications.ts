import nodemailer from "nodemailer";
import type { MonitorJob, MonitoringSnapshot } from "@/lib/database";

type NotificationInput = {
  monitor: MonitorJob;
  snapshot: MonitoringSnapshot;
};

type NotificationResult = {
  channel: "email" | "discord";
  ok: boolean;
  detail: string;
};

function buildAlertMessage({ monitor, snapshot }: NotificationInput): string {
  const percentage = snapshot.propagationPercent.toFixed(2);
  return [
    `DNS propagation reached ${percentage}% for ${monitor.domain}.`,
    `Record type: ${monitor.recordType}`,
    `Expected value: ${monitor.expectedValue}`,
    `Resolvers updated: ${snapshot.resolvedCount}/${snapshot.totalResolvers}`,
    `Monitor ID: ${monitor.id}`
  ].join("\n");
}

async function sendEmailAlert(input: NotificationInput): Promise<NotificationResult> {
  const recipient = input.monitor.notification.email;
  if (!recipient) {
    return {
      channel: "email",
      ok: false,
      detail: "No destination email configured"
    };
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "alerts@dns-propagation-radar.com";

  if (!host || !user || !pass) {
    return {
      channel: "email",
      ok: false,
      detail: "SMTP env vars are missing"
    };
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  const body = buildAlertMessage(input);

  await transport.sendMail({
    from,
    to: recipient,
    subject: `DNS propagation alert: ${input.monitor.domain}`,
    text: body
  });

  return {
    channel: "email",
    ok: true,
    detail: `Email sent to ${recipient}`
  };
}

async function sendDiscordAlert(input: NotificationInput): Promise<NotificationResult> {
  const configuredWebhook = input.monitor.notification.discordWebhookUrl ?? process.env.DISCORD_WEBHOOK_URL;

  if (!configuredWebhook) {
    return {
      channel: "discord",
      ok: false,
      detail: "No Discord webhook configured"
    };
  }

  const body = buildAlertMessage(input);
  const response = await fetch(configuredWebhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "DNS Propagation Radar",
      content: `:satellite: ${body}`
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "Webhook request failed");
    throw new Error(`Discord webhook failed with ${response.status}: ${detail}`);
  }

  return {
    channel: "discord",
    ok: true,
    detail: "Discord webhook notification sent"
  };
}

export async function sendPropagationNotifications(
  input: NotificationInput
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  if (input.monitor.notification.email) {
    try {
      results.push(await sendEmailAlert(input));
    } catch (error) {
      results.push({
        channel: "email",
        ok: false,
        detail: error instanceof Error ? error.message : "Unknown email error"
      });
    }
  }

  if (input.monitor.notification.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL) {
    try {
      results.push(await sendDiscordAlert(input));
    } catch (error) {
      results.push({
        channel: "discord",
        ok: false,
        detail: error instanceof Error ? error.message : "Unknown Discord error"
      });
    }
  }

  return results;
}
