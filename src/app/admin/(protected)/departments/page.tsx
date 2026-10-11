import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { departmentJobCounts, listDepartments } from "@/db/queries/departments";
import { DepartmentManager } from "@/components/admin/department-manager";
import { AdminToolbar } from "@/components/admin/admin-toolbar";

export default async function DepartmentsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const rows = await listDepartments();
  const jobCounts = await departmentJobCounts();
  const counts: Record<string, number> = {};
  for (const row of jobCounts) if (row.departmentId) counts[row.departmentId] = row.count;
  return (
    <section>
      <AdminToolbar eyebrow="Settings" title="Departments" />
      <DepartmentManager rows={rows} counts={counts} />
    </section>
  );
}
