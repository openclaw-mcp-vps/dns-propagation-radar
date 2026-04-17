import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dns-propagation-radar.com"),
  title: "DNS Propagation Radar",
  description:
    "Query 40 global resolvers every 60 seconds and see exactly when DNS changes propagate worldwide.",
  keywords: [
    "dns propagation check",
    "dns propagation checker",
    "dns lookup",
    "dns monitoring",
    "resolver status"
  ],
  openGraph: {
    title: "DNS Propagation Radar",
    description:
      "Track DNS propagation in real time across global resolvers and get notified when 95% converge.",
    type: "website",
    url: "https://dns-propagation-radar.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "DNS Propagation Radar",
    description:
      "Live DNS propagation dashboard with alerts for migration day."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
