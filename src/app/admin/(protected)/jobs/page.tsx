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
    <section className="admin-jobs-list">
      <AdminToolbar eyebrow="Jobs" title="Jobs" />

      <form className="admin-card admin-job-filters" action="/admin/jobs" method="get">
          <label>
            <span className="sr-only">Status</span>
            <select aria-label="Status" name="status" defaultValue={filters.status}>
              <option value="">Status</option>
              {jobStatusEnum.enumValues.map((status) => (
                <option key={status} value={status}>{jobStatusLabels[status]}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Department</span>
            <select aria-label="Department" name="department" defaultValue={filters.department}>
              <option value="">Department</option>
              {departments.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Brand</span>
            <select aria-label="Brand" name="brand" defaultValue={filters.brand}>
              <option value="">Brand</option>
              {brands.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </label>
          <label className="admin-job-search"><span className="sr-only">Search</span><input name="q" defaultValue={filters.q} maxLength={200} placeholder="Search jobs" /></label>
            <button className="admin-btn admin-job-filter-submit" type="submit" aria-label="Filter jobs" title="Filter jobs">→</button>
            {/* Fresh private-document navigation rechecks authorization and renews the CSP nonce. */}
            {rows.length > 0 && <a href="/admin/jobs" className="admin-btn admin-btn-secondary admin-job-filter-clear" aria-label="Clear filters" title="Clear filters">✕</a>}
      </form>

      {!parsed.success && <p role="status">Invalid filters were cleared.</p>}

      {rows.length === 0 ? (
        <div className="admin-card admin-empty">
          <b>{Object.values(filters).some(Boolean) ? "No jobs match these filters." : "No jobs yet"}</b>
          <p className="admin-muted" style={{ margin: 0 }}>{Object.values(filters).some(Boolean) ? "Try a different keyword or remove a filter." : "Create a job to start collecting applications."}</p>
          <div className="admin-inline">
            {Object.values(filters).some(Boolean) && <a href="/admin/jobs" className="admin-btn admin-btn-secondary">Clear filters</a>}
            <a href="/admin/jobs/new" className="admin-btn">New job</a>
          </div>
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
                         initialsOnly
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
                    <td role="cell" className="admin-muted"><time dateTime={row.updatedAt.toISOString()}>{formatAdminDay(row.updatedAt)}</time></td>
                    <td role="cell" className="admin-cell-actions">
                      <JobRowMenu id={row.id} title={row.title} status={row.status} applicationCount={countByJob.get(row.id) ?? 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-note admin-job-menu-hint">Row menu: Edit · Duplicate · Close / Reopen</div>
        </div>
      )}
    </section>
  );
}
