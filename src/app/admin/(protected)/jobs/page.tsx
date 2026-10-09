import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listJobBrandMarks, listJobs } from "@/db/queries/jobs";
import { listBrands } from "@/db/queries/brands";
import { listDepartments } from "@/db/queries/departments";
import { jobFilters } from "@/lib/validation/jobs";
import { jobStatusLabels } from "@/lib/admin/display";
import { jobStatusEnum } from "@/db/schema";
import { BrandDot } from "@/components/brand-dot";

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
  const marks = await listJobBrandMarks(rows.map(row => row.id));
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <a href="/admin/jobs/new" className="rounded border border-border px-4 py-2">
          Create job
        </a>
      </div>
      <form className="flex flex-wrap items-end gap-3" action="/admin/jobs" method="get">
        <label>
          Search
          <input
            name="q"
            defaultValue={filters.q}
            maxLength={200}
            className="block rounded border border-input p-2"
          />
        </label>
        <label>
          Status
          <select
            aria-label="Status"
            name="status"
            defaultValue={filters.status}
            className="block rounded border border-input p-2"
          >
            <option value="">All statuses</option>
            {jobStatusEnum.enumValues.map((status) => (
              <option key={status} value={status}>{jobStatusLabels[status]}</option>
            ))}
          </select>
        </label>
        <label>
          Department
          <select
            aria-label="Department"
            name="department"
            defaultValue={filters.department}
            className="block rounded border border-input p-2"
          >
            <option value="">All departments</option>
            {departments.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Brand
          <select
            aria-label="Brand"
            name="brand"
            defaultValue={filters.brand}
            className="block rounded border border-input p-2"
          >
            <option value="">All brands</option>
            {brands.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded border border-border px-4 py-2">Filter jobs</button>
        <a href="/admin/jobs">Clear filters</a>
      </form>
      {!parsed.success && <p role="status">Invalid filters were cleared.</p>}
      {rows.length === 0 ? (
        <p>No jobs match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Jobs</caption>
            <thead>
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Department</th>
                <th className="p-3">Brands</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="p-3">{row.title}</td>
                  <td className="p-3">{row.department}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-3">{marks.filter(mark => mark.jobId === row.id).map(mark => <span key={mark.id} className="inline-flex items-center gap-2"><BrandDot color={mark.accentColor} />{mark.name}</span>)}</div></td>
                  <td className="p-3">{jobStatusLabels[row.status]}</td>
                  <td className="p-3">
                    <a href={`/admin/jobs/${row.id}/edit`}>Edit {row.title}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
