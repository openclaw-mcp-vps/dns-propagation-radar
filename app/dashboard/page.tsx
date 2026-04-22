import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DnsChecker } from "@/components/dns-checker";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@/lib/auth";

export const metadata = {
  title: "Dashboard | DNS Propagation Radar",
  description: "Live DNS propagation dashboard with global resolver monitoring."
};

export default async function DashboardPage() {
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  if (!token) {
    redirect("/");
  }

  const access = await verifyAccessToken(token);
  if (!access) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Propagation Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            Live visibility into DNS propagation progress across global recursive resolvers.
          </p>
        </div>
      </section>
      <DnsChecker />
    </main>
  );
}
