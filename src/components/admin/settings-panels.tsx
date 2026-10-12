import "server-only";

import { departmentJobCounts, listDepartments } from "@/db/queries/departments";
import { listJobOptions, optionLinkCounts } from "@/db/queries/job-options";
import { AdminToolbar } from "./admin-toolbar";
import { DepartmentManager } from "./department-manager";
import { OptionsManager } from "./options-manager";

/** Both entry pages authorize independently before rendering this shared surface. */
export async function SettingsPanels() {
  const departments = await listDepartments();
  const departmentCounts = await departmentJobCounts();
  const options = await listJobOptions();
  const optionCounts = await optionLinkCounts();
  const counts: Record<string, number> = {};
  for (const row of departmentCounts) if (row.departmentId) counts[row.departmentId] = row.count;
  return <section>
    <AdminToolbar eyebrow="Settings" title="Departments & options" />
    <div className="admin-grid admin-settings-combined">
      <DepartmentManager rows={departments} counts={counts} />
      <OptionsManager rows={options.map(({ id, group, label, slug, sortOrder, isActive }) => ({ id, group, label, slug, sortOrder, isActive }))} counts={Object.fromEntries(optionCounts)} />
    </div>
  </section>;
}
