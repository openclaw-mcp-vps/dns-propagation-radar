import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, CheckCircle2, Globe2, BellRing, Clock3, ShieldCheck } from "lucide-react";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@/lib/auth";
import { AccessClaim } from "@/components/access-claim";

const faqs = [
  {
    q: "How often does DNS Propagation Radar check?",
    a: "Every monitor runs a full global sweep every 60 seconds by default. You can pause and resume at any time from the dashboard."
  },
  {
    q: "Which resolvers are included?",
    a: "The platform tracks Google, Cloudflare, Quad9, OpenDNS, and dozens of additional public recursive resolvers across North America, Europe, Asia-Pacific, South America, Africa, and the Middle East."
  },
  {
    q: "Can I get alerted without keeping the page open?",
    a: "Yes. Add an email address or Discord webhook in monitor settings and you will get notified the moment your propagation target is reached."
  },
  {
    q: "Do you support A, AAAA, CNAME, MX, TXT, and NS checks?",
    a: "Yes. You can choose the record type and expected value when creating each monitor."
  }
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const access = token ? await verifyAccessToken(token) : null;
  const stripePaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="text-sm font-semibold tracking-wide text-blue-300">DNS Propagation Radar</div>
        {access ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-200"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <a
            href={stripePaymentLink}
            className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-400"
          >
            Buy Access <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </header>

      <section className="grid gap-8 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#111720] px-3 py-1 text-xs text-slate-300">
            <Clock3 className="h-3.5 w-3.5" /> DNS propagation check for real deployments
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-100 sm:text-5xl">
            Query 40 global resolvers every minute and see the exact moment the world catches up.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            You changed a DNS record and now everyone is asking the same question: has propagation
            finished yet? DNS Propagation Radar continuously checks major nameservers worldwide,
            shows live status on a map, and alerts you once 95% of resolvers return the new value.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {access ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <a
                href={stripePaymentLink}
                className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Start for $12/month <ArrowRight className="h-4 w-4" />
              </a>
            )}
            <Link
              href="#faq"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-[#161b22]"
            >
              Read FAQ
            </Link>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-[#111720] p-3">40+ resolvers</div>
            <div className="rounded-lg border border-slate-800 bg-[#111720] p-3">60s polling cadence</div>
            <div className="rounded-lg border border-slate-800 bg-[#111720] p-3">95% threshold alerts</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#111720] p-5">
            <h2 className="text-lg font-semibold text-slate-100">Why teams use this</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                Stop manually refreshing ad-heavy DNS checker sites.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                Watch regional lag in real time during provider migrations.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                Alert your team in email or Discord when it's safe to cut over.
              </li>
            </ul>
          </div>
          {!access && <AccessClaim />}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-[#111720] p-5">
          <Globe2 className="h-5 w-5 text-blue-400" />
          <h3 className="mt-3 text-lg font-semibold text-slate-100">Global Resolver Coverage</h3>
          <p className="mt-2 text-sm text-slate-300">
            Get visibility across real recursive DNS providers and regional infrastructure,
            not a single location test.
          </p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-[#111720] p-5">
          <BellRing className="h-5 w-5 text-blue-400" />
          <h3 className="mt-3 text-lg font-semibold text-slate-100">Automatic Threshold Alerts</h3>
          <p className="mt-2 text-sm text-slate-300">
            Define your target match percentage and receive alerts as soon as propagation reaches
            your confidence level.
          </p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-[#111720] p-5">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          <h3 className="mt-3 text-lg font-semibold text-slate-100">Built for Migrations</h3>
          <p className="mt-2 text-sm text-slate-300">
            Perfect for domain cutovers to Vercel, Netlify, Cloudflare, AWS, Hetzner, and other
            hosting providers.
          </p>
        </article>
      </section>

      <section className="mt-12 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600/15 to-cyan-500/10 p-8">
        <h2 className="text-2xl font-bold text-slate-100">Simple pricing for high-stress DNS changes</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          One plan includes unlimited monitoring sessions, live map updates, and threshold alerts.
          No usage traps, no ad clutter, no waiting blind during your migration window.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="text-4xl font-bold text-white">$12</div>
          <div className="text-sm text-slate-300">per month</div>
        </div>
        <div className="mt-5">
          {access ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400"
            >
              Open Dashboard
            </Link>
          ) : (
            <a
              href={stripePaymentLink}
              className="inline-flex items-center rounded-md bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400"
            >
              Buy on Stripe
            </a>
          )}
        </div>
      </section>

      <section id="faq" className="mt-12">
        <h2 className="text-2xl font-bold text-slate-100">FAQ</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-xl border border-slate-800 bg-[#111720] p-4">
              <h3 className="text-sm font-semibold text-slate-100">{item.q}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
