import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE_NAME, verifyAccessCookie } from "@/lib/auth";
import { getPurchaseRecord } from "@/lib/database";
import { MonitorDashboard } from "@/components/monitor-dashboard";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const payload = verifyAccessCookie(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  if (!payload?.email) {
    redirect("/#pricing");
  }

  const purchase = await getPurchaseRecord(payload.email);

  if (!purchase || purchase.status !== "active") {
    redirect("/#pricing");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">DNS Monitoring Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Start a monitor, keep the tab open, and stream propagation updates in real time via server-sent events.
        </p>
      </div>

      <MonitorDashboard />
    </main>
  );
}
