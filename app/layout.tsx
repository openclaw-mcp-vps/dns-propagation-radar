import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "@/app/globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dnspropagationradar.com"),
  title: "DNS Propagation Radar | DNS Propagation Check with Alerts",
  description:
    "Track DNS propagation across 40+ global resolvers every minute. See live map coverage and get notified at 95% adoption.",
  applicationName: "DNS Propagation Radar",
  keywords: [
    "dns propagation check",
    "dns propagation",
    "dns monitor",
    "dns alert",
    "global dns checker"
  ],
  openGraph: {
    title: "DNS Propagation Radar",
    description:
      "Query 40+ global resolvers every 60 seconds and know the exact moment the internet catches up.",
    url: "https://dnspropagationradar.com",
    siteName: "DNS Propagation Radar",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DNS Propagation Radar",
    description:
      "Live DNS propagation checks with global resolver coverage and threshold alerts."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${sans.variable} ${mono.variable} bg-[#0d1117] font-[var(--font-sans)] text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
