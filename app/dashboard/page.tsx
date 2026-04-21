import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { DashboardClient } from "@/components/dashboard-client";
import { hasPurchaseForEmail } from "@/lib/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function unlockAccess(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/dashboard?unlock=invalid");
  }

  const purchased = await hasPurchaseForEmail(email);

  if (!purchased) {
    redirect("/dashboard?unlock=missing");
  }

  const cookieStore = await cookies();

  cookieStore.set("dpr_access", "paid", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  cookieStore.set("dpr_purchased_email", email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  redirect("/dashboard?unlock=success");
}

interface DashboardPageProps {
  searchParams?: Promise<{
    unlock?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("dpr_access")?.value === "paid";

  if (!hasAccess) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-zinc-200">
            ← Back to landing page
          </Link>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-300">
            <Lock className="size-3.5" />
            Dashboard access required
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-zinc-50">Unlock DNS Propagation Radar</h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            This monitoring dashboard is behind the paid plan. Buy access with Stripe Checkout,
            then unlock with the same purchase email once webhook confirmation lands.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Buy for $12/mo
            </a>
            <Link
              href="/"
              className="rounded-lg border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
            >
              Review Plan Details
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8">
          <h2 className="text-xl font-semibold text-zinc-100">Already purchased?</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your checkout email to set an access cookie for this browser.
          </p>

          <form action={unlockAccess} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/40 transition focus:ring"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
            >
              <ShieldCheck className="size-4" />
              Unlock Dashboard
            </button>
          </form>

          {params.unlock === "invalid" ? (
            <p className="mt-3 text-sm text-rose-300">Enter a valid purchase email.</p>
          ) : null}

          {params.unlock === "missing" ? (
            <p className="mt-3 text-sm text-rose-300">
              No matching purchase found yet. Confirm webhook delivery and retry.
            </p>
          ) : null}

          {params.unlock === "success" ? (
            <p className="mt-3 text-sm text-emerald-300">Access granted for this browser session.</p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-8 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-sm text-zinc-400 transition hover:text-zinc-200">
          ← Back to landing page
        </Link>
        <p className="text-xs text-zinc-500">Paid session active</p>
      </header>
      <DashboardClient />
    </main>
  );
}
