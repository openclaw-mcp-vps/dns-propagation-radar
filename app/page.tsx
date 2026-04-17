import Link from "next/link";
import { Globe, BellRing, Radar, ShieldCheck } from "lucide-react";
import { PricingTable } from "@/components/pricing-table";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <header className="mb-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <p className="text-sm font-medium text-slate-200">DNS Propagation Radar</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400"
        >
          Open Dashboard
        </Link>
      </header>

      <section className="panel relative overflow-hidden p-8 md:p-12">
        <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <p className="badge mb-4">Built for migration day pressure</p>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-5xl">
          Query 40 global nameservers every 60 seconds and watch the exact moment the world catches up.
        </h1>
        <p className="mt-5 max-w-3xl text-base text-slate-300 md:text-lg">
          When you repoint a domain to Vercel, Cloudflare, AWS, Hetzner, or Netlify, uncertainty is the outage.
          DNS Propagation Radar gives you a resolver-by-resolver live feed, world map visibility, and threshold
          alerts so you can make release decisions with confidence.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#pricing"
            className="rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            Start For $12/mo
          </a>
          <Link
            href="/dashboard"
            className="rounded-md border border-slate-600 px-5 py-3 text-sm text-slate-100 transition hover:border-slate-400"
          >
            See Product
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="panel p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Radar className="h-5 w-5 text-emerald-400" />
            Problem: DNS checks are noisy and slow
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Most propagation tools are ad-heavy, refresh slowly, and hide critical details. During a migration window,
            you need exact resolver answers and a clear propagation percentage, not screenshots and guessing.
          </p>
        </article>
        <article className="panel p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Globe className="h-5 w-5 text-emerald-400" />
            Solution: Global resolver telemetry
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            We poll major and regional resolvers across North America, Europe, Asia-Pacific, South America, and
            Africa every minute. You see where old records remain and where new records have landed.
          </p>
        </article>
        <article className="panel p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <BellRing className="h-5 w-5 text-emerald-400" />
            Alerting when it matters
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Configure email and Discord webhook notifications at 95% propagation. Stop manually refreshing and let the
            system tell you when you can confidently proceed.
          </p>
        </article>
        <article className="panel p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Built for incident workflows
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Share links internally, keep a timestamped propagation timeline, and de-risk cutovers. The dashboard is
            gated for paid subscribers, with cookie access after purchase verification.
          </p>
        </article>
      </section>

      <section className="mt-10">
        <PricingTable />
      </section>

      <section className="mt-10 panel p-8">
        <h3 className="text-2xl font-semibold text-white">FAQ</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-700 p-4">
            <h4 className="text-sm font-semibold text-white">How often are resolvers checked?</h4>
            <p className="mt-2 text-sm text-slate-300">
              Every active check runs every 60 seconds. You can leave it open during a migration and watch convergence
              in real time.
            </p>
          </article>
          <article className="rounded-lg border border-slate-700 p-4">
            <h4 className="text-sm font-semibold text-white">What record types are supported?</h4>
            <p className="mt-2 text-sm text-slate-300">A, AAAA, CNAME, MX, TXT, and NS records are supported in the dashboard.</p>
          </article>
          <article className="rounded-lg border border-slate-700 p-4">
            <h4 className="text-sm font-semibold text-white">How does access work after payment?</h4>
            <p className="mt-2 text-sm text-slate-300">
              Lemon Squeezy webhook events store your paid email, then an unlock flow issues a secure cookie for
              dashboard access.
            </p>
          </article>
          <article className="rounded-lg border border-slate-700 p-4">
            <h4 className="text-sm font-semibold text-white">Can I send alerts to Discord?</h4>
            <p className="mt-2 text-sm text-slate-300">
              Yes. Add an incoming webhook URL for your incident channel and we will ping it when threshold criteria is
              met.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
