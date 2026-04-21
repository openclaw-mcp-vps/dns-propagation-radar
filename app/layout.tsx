import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"]
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dns-propagation-radar.com"),
  title: "DNS Propagation Radar | Live DNS Propagation Check with Global Resolver Map",
  description:
    "Check DNS propagation in real time across 40+ global resolvers. Monitor A, AAAA, CNAME, TXT, MX and NS records, then get alerted when 95% of the world catches up.",
  keywords: [
    "dns propagation check",
    "dns checker",
    "dns propagation",
    "global dns lookup",
    "dns monitoring",
    "dns migration"
  ],
  openGraph: {
    type: "website",
    title: "DNS Propagation Radar",
    description:
      "Query 40+ global resolvers every 60 seconds and watch DNS propagation on a live world map.",
    url: "https://dns-propagation-radar.com",
    siteName: "DNS Propagation Radar"
  },
  twitter: {
    card: "summary_large_image",
    title: "DNS Propagation Radar",
    description:
      "Live DNS propagation status across global resolvers with alerts at 95% adoption."
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-screen bg-[#0d1117] text-zinc-100 antialiased`}
      >
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.08),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.1),transparent_35%)]" />
        {children}
      </body>
    </html>
  );
}
