import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { loadReviewDashboard } from "@/db/queries/review";
import { applicationStatusEnum } from "@/db/schema";
import { ApplicationTable } from "@/components/admin/application-table";

export default async function DashboardPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const { counts, latest } = await loadReviewDashboard().catch(() => { throw new Error("Unable to load application dashboard."); });
  const total = counts.reduce((sum, row) => sum + row.count, 0);
  return (
    <section>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[{ status: "", label: "Total", count: total }, ...applicationStatusEnum.enumValues.map((status) => ({ status, label: status.replaceAll("_", " "), count: counts.find((row) => row.status === status)?.count ?? 0 }))].map((item) =>
          <a key={item.label} href={item.status ? `/admin/applications?status=${item.status}` : "/admin/applications"} className="rounded-xl border border-border bg-card p-5"><h2 className="capitalize">{item.label}</h2><p className="mt-2 text-3xl font-semibold">{item.count}</p></a>)}
      </div>
      <h2 className="mb-4 text-xl font-semibold">Latest applications</h2>
      <ApplicationTable rows={latest} />
    </section>
  );
}
