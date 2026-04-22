import nodemailer from "nodemailer";
import { DnsMonitor } from "@/types/dns";

type NotificationPayload = {
  title: string;
  message: string;
  email?: string;
  discordWebhook?: string;
};

function canSendEmail() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.ALERTS_FROM_EMAIL
  );
}

async function sendEmail(to: string, subject: string, body: string) {
  if (!canSendEmail()) {
    return { sent: false, reason: "SMTP not configured" };
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transport.sendMail({
    from: process.env.ALERTS_FROM_EMAIL,
    to,
    subject,
    text: body
  });

  return { sent: true };
}

async function sendDiscord(webhookUrl: string, title: string, message: string) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title,
          description: message,
          color: 0x3b82f6,
          timestamp: new Date().toISOString()
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with status ${response.status}`);
  }

  return { sent: true };
}

export async function sendNotification(payload: NotificationPayload) {
  const outcomes: Array<{ channel: string; sent: boolean; reason?: string }> = [];

  if (payload.email) {
    try {
      const emailResult = await sendEmail(payload.email, payload.title, payload.message);
      outcomes.push({ channel: "email", sent: emailResult.sent, reason: emailResult.reason });
    } catch (error) {
      outcomes.push({ channel: "email", sent: false, reason: error instanceof Error ? error.message : "Email error" });
    }
  }

  const discordUrl = payload.discordWebhook || process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    try {
      await sendDiscord(discordUrl, payload.title, payload.message);
      outcomes.push({ channel: "discord", sent: true });
    } catch (error) {
      outcomes.push({ channel: "discord", sent: false, reason: error instanceof Error ? error.message : "Discord error" });
    }
  }

  if (!payload.email && !discordUrl) {
    outcomes.push({ channel: "none", sent: false, reason: "No notification channel configured" });
  }

  return outcomes;
}

export async function sendThresholdNotification(monitor: DnsMonitor) {
  if (!monitor.latestCheck) {
    return;
  }

  const title = `DNS propagation reached ${monitor.latestCheck.stats.matchedPercentage}%`;
  const lines = [
    `Domain: ${monitor.domain}`,
    `Record Type: ${monitor.recordType}`,
    `Expected Value: ${monitor.expectedValue}`,
    `Matched Resolvers: ${monitor.latestCheck.stats.matchedResolvers}/${monitor.latestCheck.stats.totalResolvers}`,
    `Checked At: ${monitor.latestCheck.checkedAt}`,
    `Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`
  ];

  await sendNotification({
    title,
    message: lines.join("\n"),
    email: monitor.notification.email,
    discordWebhook: monitor.notification.discordWebhook
  });
}
