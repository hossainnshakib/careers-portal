import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { jobApplicationCounts, listJobBrandMarks, listJobs } from "@/db/queries/jobs";
import { jobOptionsFor } from "@/db/queries/job-options";
import { listBrands } from "@/db/queries/brands";
import { listDepartments } from "@/db/queries/departments";
import { jobFilters } from "@/lib/validation/jobs";
import { jobStatusLabels } from "@/lib/admin/display";
import { jobStatusEnum } from "@/db/schema";
import { optionGroups } from "@/lib/careers/option-labels";
import { BrandMarks } from "@/components/admin/brand-mark";
import { JobStatusBadge } from "@/components/admin/status-badge";
import { JobRowMenu } from "@/components/admin/job-row-menu";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { formatAdminDay } from "@/lib/admin/display";

function salaryText(row: { salaryMode: "negotiable" | "range"; salaryText: string | null }) {
  return row.salaryMode === "range" && row.salaryText ? row.salaryText : "Negotiable";
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin().catch(redirectAdminDenial);
  const params = await searchParams;
  const parsed = jobFilters.safeParse({
    status: params.status ?? "",
    department: params.department ?? "",
    brand: params.brand ?? "",
    q: params.q ?? "",
  });
  const filters = parsed.success ? parsed.data : jobFilters.parse({});
  const rows = await listJobs(filters);
  const brands = await listBrands();
  const departments = await listDepartments();
  const marks = await listJobBrandMarks(rows.map((row) => row.id));
  const optionsByJob = await jobOptionsFor(rows.map((row) => row.id));
  const counts = await jobApplicationCounts(rows.map((row) => row.id));
  const countByJob = new Map(counts.map((row) => [row.jobId, row.count]));
  return (
    <section>
      <AdminToolbar eyebrow="Jobs" title="Jobs" />
      <p><a href="/admin/jobs/import" className="admin-btn">Import jobs</a></p>

      <form className="admin-card" action="/admin/jobs" method="get" style={{ marginBottom: 14 }}>
        <div className="admin-filter-fields is-open">
          <label>
            Search
            <input name="q" defaultValue={filters.q} maxLength={200} />
          </label>
          <label>
            Status
            <select aria-label="Status" name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {jobStatusEnum.enumValues.map((status) => (
                <option key={status} value={status}>{jobStatusLabels[status]}</option>
              ))}
            </select>
          </label>
          <label>
            Department
            <select aria-label="Department" name="department" defaultValue={filters.department}>
              <option value="">All departments</option>
              {departments.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </label>
          <label>
            Brand
            <select aria-label="Brand" name="brand" defaultValue={filters.brand}>
              <option value="">All brands</option>
              {brands.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </label>
          <div className="admin-filter-actions">
            <button className="admin-btn" type="submit">Filter jobs</button>
            {/* Fresh private-document navigation rechecks authorization and renews the CSP nonce. */}
            <a href="/admin/jobs" className="admin-link">Clear filters</a>
          </div>
        </div>
      </form>

      {!parsed.success && <p role="status">Invalid filters were cleared.</p>}

      {rows.length === 0 ? (
        <div className="admin-card admin-empty">
          <b>No jobs match these filters.</b>
          <p className="admin-muted" style={{ margin: 0 }}>Try a different keyword or remove a filter.</p>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table admin-table-jobs">
            <table role="table" aria-label="Jobs">
              <thead role="rowgroup">
                <tr role="row">
                  {["Title", "Department", "Brands", "Options", "Salary", "Status", "Apps", "Updated", ""].map((label) => (
                    <th key={label} role="columnheader" scope="col">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody role="rowgroup">
                {rows.map((row) => (
                  <tr key={row.id} role="row">
                    <td role="cell" className="admin-cell-title">
                      <a href={`/admin/jobs/${row.id}/edit`}>{row.title}</a>
                    </td>
                    <td role="cell" className="admin-cell-dept">{row.department}</td>
                    <td role="cell" className="admin-cell-brands">
                      <BrandMarks
                        brands={marks.filter((mark) => mark.jobId === row.id).map((mark) => ({
                          id: mark.id,
                          name: mark.name,
                          accentColor: mark.accentColor,
                          logoUrl: mark.logoUrl,
                        }))}
                      />
                    </td>
                    <td role="cell" className="admin-muted">
                      {optionGroups
                        .map((group) => (optionsByJob.get(row.id) ?? []).filter((option) => option.group === group).map((option) => option.label))
                        .filter((labels) => labels.length)
                        .flat()
                        .join(" · ") || "None"}
                    </td>
                    <td role="cell">{salaryText(row)}</td>
                    <td role="cell" className="admin-cell-status"><JobStatusBadge status={row.status} /></td>
                    <td role="cell">{countByJob.get(row.id) ?? 0}</td>
                    <td role="cell"><time dateTime={row.updatedAt.toISOString()}>{formatAdminDay(row.updatedAt)}</time></td>
                    <td role="cell" className="admin-cell-actions">
                      <JobRowMenu id={row.id} title={row.title} status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
