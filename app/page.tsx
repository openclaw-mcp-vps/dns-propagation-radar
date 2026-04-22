import Link from "next/link";
import { BarChart3, BellRing, Globe, Timer } from "lucide-react";
import { Pricing } from "@/components/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const problemBullets = [
  "Resolvers update at different times, so one region can still return stale DNS while another is already live.",
  "Free checkers are slow, ad-heavy, and force manual refreshes when every minute matters.",
  "Teams lose time in Slack asking, 'is it propagated yet?', without hard evidence by region."
];

const solutionCards = [
  {
    title: "40+ Resolver Coverage",
    description:
      "Google, Cloudflare, Quad9, OpenDNS, and regional endpoints across EU, AP, SA, AF, and ME in one session.",
    icon: Globe
  },
  {
    title: "60-Second Global Polling",
    description:
      "Continuous checks every minute with per-resolver answers so you can prove exactly where propagation is lagging.",
    icon: Timer
  },
  {
    title: "95% Alerting",
    description:
      "Get notified by email or Discord the moment your configured propagation threshold is crossed.",
    icon: BellRing
  },
  {
    title: "Propagation Timeline",
    description:
      "Track progress on a chart and map to estimate when your migration is safe to announce broadly.",
    icon: BarChart3
  }
];

const faq = [
  {
    q: "How is this different from a basic DNS checker?",
    a: "You get continuous polling every 60 seconds, a map, a trend chart, and alerting. It is built for active migrations, not one-off lookups."
  },
  {
    q: "Can I monitor TXT records during email cutovers?",
    a: "Yes. A, AAAA, CNAME, MX, TXT, and NS are supported. TXT entries are preserved as full strings in the resolver output."
  },
  {
    q: "Does it work for team handoffs?",
    a: "Yes. Each run keeps snapshots so you can share objective resolver-by-resolver status with engineering, support, and incident channels."
  },
  {
    q: "When do alerts fire?",
    a: "You choose a threshold (95% by default). Once reached, the monitor sends notifications and marks the run as complete."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="mb-14 flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight text-slate-100">dns-propagation-radar</div>
        <div className="flex items-center gap-3">
          <Link href="#pricing" className="text-sm text-slate-300 transition-colors hover:text-cyan-300">
            Pricing
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <section className="mb-16 animate-fade-up">
        <p className="mb-3 inline-flex rounded-full border border-cyan-700/50 bg-cyan-950/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-cyan-200">
          DNS propagation check for real migrations
        </p>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Query 40 global resolvers every 60 seconds and see the exact moment the world catches up.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-slate-300">
          DNS Propagation Radar tracks live resolver status while you migrate domains to Vercel, Netlify, Cloudflare, Hetzner, or AWS. Instead of guessing, you get hard data and alerts when propagation is safe.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#pricing"
            className="inline-flex h-11 items-center rounded-md bg-cyan-400 px-6 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-300"
          >
            Start for $12/month
          </a>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-md border border-slate-700 px-6 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-900"
          >
            I already paid
          </Link>
        </div>
      </section>

      <section className="mb-16 grid gap-5 lg:grid-cols-3">
        {problemBullets.map((bullet) => (
          <Card key={bullet} className="bg-[#0d1526]">
            <CardContent className="pt-6 text-sm leading-relaxed text-slate-300">{bullet}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold text-white sm:text-3xl">How the tool removes DNS rollout anxiety</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {solutionCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-cyan-300" />
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-slate-300">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="mb-16 scroll-mt-12">
        <h2 className="mb-6 text-2xl font-semibold text-white sm:text-3xl">Simple pricing for migration windows</h2>
        <Pricing />
      </section>

      <section className="mb-8">
        <h2 className="mb-5 text-2xl font-semibold text-white sm:text-3xl">FAQ</h2>
        <div className="grid gap-4">
          {faq.map((item) => (
            <Card key={item.q}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">{item.a}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-slate-800 pt-6 text-sm text-slate-400">
        Built for developers shipping DNS changes under deadline pressure.
      </footer>
    </main>
  );
}
