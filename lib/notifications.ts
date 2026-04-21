import nodemailer from "nodemailer";
import type { MonitorSnapshot, NotificationSubscription } from "@/lib/types";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true";

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });

  return transporter;
}

function buildAlertText(snapshot: MonitorSnapshot): string {
  const at = new Date(snapshot.checkedAt).toUTCString();

  return [
    `DNS propagation threshold reached for ${snapshot.domain} (${snapshot.recordType}).`,
    `Propagation: ${snapshot.propagationPercent.toFixed(1)}% (${snapshot.propagatedCount}/${snapshot.totalResolvers} resolvers).`,
    `Target: ${snapshot.targetDescription}`,
    `Checked: ${at}`,
    "Open the dashboard to inspect resolver-level details."
  ].join("\n");
}

export async function sendPropagationNotification(input: {
  subscription: NotificationSubscription;
  snapshot: MonitorSnapshot;
}) {
  const { subscription, snapshot } = input;
  const messageText = buildAlertText(snapshot);

  if (subscription.email) {
    const client = getTransporter();

    if (client) {
      const from = process.env.SMTP_FROM ?? "alerts@dns-propagation-radar.local";

      await client.sendMail({
        from,
        to: subscription.email,
        subject: `DNS propagation reached ${snapshot.propagationPercent.toFixed(1)}% for ${snapshot.domain}`,
        text: messageText
      });
    } else {
      console.info(
        `[notifications] SMTP not configured; skipped email delivery to ${subscription.email}`
      );
    }
  }

  if (subscription.discordWebhookUrl) {
    const payload = {
      content: `**DNS propagation alert**\n${messageText}`
    };

    const response = await fetch(subscription.discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed with status ${response.status}`);
    }
  }
}
