import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { loadReviewDashboard, openRolesByDepartment } from "@/db/queries/review";
import { applicationStatusEnum } from "@/db/schema";
import { ApplicationTable } from "@/components/admin/application-table";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { applicationStatusLabel } from "@/lib/admin/display";

export default async function DashboardPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const { counts, latest, brandAccents } = await loadReviewDashboard().catch(() => {
    throw new Error("Unable to load application dashboard.");
  });
  const openRoles = await openRolesByDepartment().catch(() => {
    throw new Error("Unable to load application dashboard.");
  });
  const total = counts.reduce((sum, row) => sum + row.count, 0);
  const stats = [
    { status: "", label: "Total", count: total, outline: false },
    ...applicationStatusEnum.enumValues.map((status) => ({
      status,
      label: applicationStatusLabel(status),
      count: counts.find((row) => row.status === status)?.count ?? 0,
      outline: status === "new",
    })),
  ];
  const maxRoles = Math.max(1, ...openRoles.map((row) => row.count));
  return (
    <section>
      <AdminToolbar eyebrow="Overview" title="Dashboard" />

      <div className="admin-grid admin-grid-6">
        {stats.map((item) => (
          <a
            key={item.label}
            href={item.status ? `/admin/applications?status=${item.status}` : "/admin/applications"}
            className={`admin-card admin-stat${item.outline ? " is-outline" : ""}`}
          >
            <span className="admin-kicker is-muted">{item.label}</span>
            <b>{item.count}</b>
          </a>
        ))}
      </div>

      <div className="admin-grid admin-grid-latest">
        <div className="admin-card admin-mobile-flat">
          <h2 className="admin-kicker" style={{ margin: 0 }}>
            Latest applications
          </h2>
          <div style={{ marginTop: 8 }}>
            <ApplicationTable rows={latest} brandAccents={brandAccents} />
          </div>
        </div>

        <div className="admin-card">
          <h2 className="admin-kicker" style={{ margin: 0 }}>
            Open roles by department
          </h2>
          <div style={{ margin: "12px 0" }}>
            {openRoles.length === 0 && (
              <p className="admin-note" style={{ margin: "8px 0" }}>
                No open roles yet.
              </p>
            )}
            {openRoles.map((row) => (
              <div key={row.departmentId} style={{ margin: "12px 0" }}>
                <div className="admin-bar-row">
                  <span>{row.name}</span>
                  <b>{row.count}</b>
                </div>
                <div className="admin-bar">
                  <i style={{ width: `${Math.round((row.count / maxRoles) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
