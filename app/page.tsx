import Link from "next/link";
import {
  Activity,
  Bell,
  Globe,
  Radar,
  ShieldCheck,
  TimerReset
} from "lucide-react";

const steps = [
  {
    title: "Start a monitor in 15 seconds",
    detail:
      "Pick a domain and record type, then optionally set the exact value you expect after migration."
  },
  {
    title: "Watch global resolver adoption live",
    detail:
      "We query 40+ resolvers every minute and stream status into a live map and timeline."
  },
  {
    title: "Get notified at your threshold",
    detail:
      "Receive an alert when 95% of resolvers see your new value, so you can continue rollout confidently."
  }
];

const faqs = [
  {
    q: "How is this different from free DNS checker sites?",
    a: "You get live streaming updates, resolver-level history, fast polling every 60 seconds, and alerting. No ads, no page reload loops, and no guesswork."
  },
  {
    q: "What record types are supported?",
    a: "A, AAAA, CNAME, TXT, MX, and NS. You can monitor by exact expected value or by majority consensus."
  },
  {
    q: "When should I run a propagation check?",
    a: "Use it for cutovers to Vercel, Netlify, Cloudflare, Hetzner, AWS, or any nameserver change where delayed resolvers can break traffic."
  },
  {
    q: "How do alerts work?",
    a: "Set email and/or Discord notifications per monitor. We send an alert when your threshold is reached and avoid duplicate sends."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 sm:px-10 lg:py-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200">
            <Radar className="size-3.5" />
            Real-time DNS propagation check
          </p>
          <h1 className="text-4xl font-bold leading-tight text-zinc-50 sm:text-5xl">
            Query 40 global nameservers every 60 seconds and see the exact moment the world catches up.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-300">
            DNS Propagation Radar tracks your DNS changes across major and regional resolvers in one
            live dashboard. Stop refreshing ad-heavy checkers and start shipping migrations with
            confidence.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Open Dashboard
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
              className="rounded-lg border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
            >
              Buy for $12/mo
            </a>
          </div>
          <div className="grid gap-4 text-sm text-zinc-300 sm:grid-cols-3">
            <p className="flex items-center gap-2">
              <Activity className="size-4 text-cyan-300" />
              40+ resolver checks per cycle
            </p>
            <p className="flex items-center gap-2">
              <TimerReset className="size-4 text-emerald-300" />
              60-second polling cadence
            </p>
            <p className="flex items-center gap-2">
              <Bell className="size-4 text-sky-300" />
              95% threshold alerts
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-zinc-100">Why teams pay for this</h2>
          <ul className="mt-4 space-y-4 text-sm text-zinc-300">
            <li className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              We hit this pain ourselves during a cutover of <span className="mono">umami.microtool.dev</span>.
              Visibility into lagging resolvers was the missing piece.
            </li>
            <li className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              Migration windows are expensive. One unclear DNS state can block launches, incident
              response, and on-call sleep.
            </li>
            <li className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              This is built for developers and ops teams, not ad impressions. Fast checks, clear map,
              actionable alerts.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold text-zinc-50">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(34,211,238,0.05)]"
            >
              <p className="text-xs font-semibold tracking-wide text-cyan-300">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="text-3xl font-semibold text-zinc-50">Problem</h2>
          <p className="mt-3 text-zinc-300">
            During DNS migrations, nobody knows when global resolvers have truly converged. Existing
            tools are noisy, slow, and disconnected from the workflows where decisions happen.
          </p>
        </article>
        <article className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-6">
          <h2 className="text-3xl font-semibold text-emerald-100">Solution</h2>
          <p className="mt-3 text-emerald-100/90">
            One focused dashboard: global resolver map, per-resolver answers, trend line, and alerts to
            email or Discord when your chosen threshold is reached.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8">
        <h2 className="text-3xl font-semibold text-zinc-50">Pricing</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-xl border border-cyan-400/35 bg-cyan-400/10 p-6">
            <p className="text-sm font-semibold text-cyan-200">Pro</p>
            <p className="mt-2 text-4xl font-bold text-zinc-50">
              $12<span className="text-lg text-zinc-300">/mo</span>
            </p>
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Buy Access
            </a>
          </div>
          <ul className="grid gap-3 text-sm text-zinc-200 sm:grid-cols-2">
            <li className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <ShieldCheck className="mb-2 size-4 text-emerald-300" />
              Unlimited monitor sessions while active
            </li>
            <li className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <Globe className="mb-2 size-4 text-cyan-300" />
              40+ global and regional resolver vantage points
            </li>
            <li className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <Activity className="mb-2 size-4 text-sky-300" />
              60-second polling with resolver-level diffs
            </li>
            <li className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <Bell className="mb-2 size-4 text-violet-300" />
              Email + Discord threshold notifications
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-5 pb-8">
        <h2 className="text-3xl font-semibold text-zinc-50">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h3 className="text-base font-semibold text-zinc-100">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
