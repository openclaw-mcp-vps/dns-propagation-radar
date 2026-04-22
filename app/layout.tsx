import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "@/app/globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"]
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dns-propagation-radar.com"),
  title: "DNS Propagation Radar | Live DNS Propagation Check",
  description:
    "Run a real-time dns propagation check across 40+ global resolvers, watch updates on a live map, and get notified when 95% of the world sees your new DNS value.",
  keywords: [
    "dns propagation check",
    "dns checker",
    "global dns propagation",
    "dns update monitor",
    "dns migration tool"
  ],
  openGraph: {
    title: "DNS Propagation Radar",
    description:
      "Query 40 global resolvers every 60 seconds during a DNS change and see the exact moment the world catches up.",
    type: "website",
    url: "https://dns-propagation-radar.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "DNS Propagation Radar",
    description:
      "Live DNS propagation check with a global map and 95% threshold notifications for email and Discord."
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${headingFont.variable} ${monoFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
