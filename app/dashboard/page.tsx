import Link from "next/link";
import { cookies } from "next/headers";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("dpr_access")?.value === "active";

  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="panel p-8 text-center">
          <p className="badge">Subscription Required</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Dashboard access is behind the Pro paywall</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            Purchase DNS Propagation Radar Pro, then unlock access with your billing email on the landing page.
            Access is stored in a secure cookie.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            Go To Pricing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <DashboardClient />
    </main>
  );
}
