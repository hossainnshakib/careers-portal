import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listDepartments } from "@/db/queries/departments";
import { DepartmentManager } from "@/components/admin/department-manager";

export default async function DepartmentsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const rows = await listDepartments();
  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Departments</h1>
      <DepartmentManager rows={rows} />
    </section>
  );
}
