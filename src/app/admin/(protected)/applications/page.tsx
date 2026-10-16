import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listReviewApplications, reviewFilterOptions, reviewPageSize } from "@/db/queries/review";
import { reviewFilters } from "@/lib/validation/review";
import { ApplicationTable } from "@/components/admin/application-table";
import { ReviewFilterForm } from "@/components/admin/review-filters";
import { DeleteApplicationControl } from "@/components/admin/review-controls";
import { AdminToolbar } from "@/components/admin/admin-toolbar";

function pageWindow(page: number, pages: number) {
  const wanted = new Set<number>([1, pages, page - 1, page, page + 1]);
  return [...wanted].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
}

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin().catch(redirectAdminDenial);
  const params = await searchParams;
  const allowed = ["brand", "department", "job", "status", "q", "from", "to", "tz", "sort", "page", "cleanup"];
  const parsed = reviewFilters.safeParse(Object.fromEntries(allowed.filter((key) => params[key] !== undefined).map((key) => [key, params[key]])));
  const filters = parsed.success ? parsed.data : reviewFilters.parse({});
  const result = await listReviewApplications(filters).catch(() => { throw new Error("Unable to load applications."); });
  const options = await reviewFilterOptions().catch(() => { throw new Error("Unable to load applications."); });
  const hasFilters = [filters.brand, filters.department, filters.job, filters.status, filters.q, filters.from, filters.to].some(Boolean);
  function pageUrl(page: number) {
    const values = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value !== "" && key !== "page" && key !== "cleanup") values.set(key, String(value));
    values.set("page", String(page));
    return `/admin/applications?${values}`;
  }
  return (
    <section className="admin-applications-list">
      <AdminToolbar eyebrow="Applications" title="Applications" />
      {!parsed.success && <p role="status">Invalid filters were cleared.</p>}
      {filters.cleanup && <DeleteApplicationControl applicationId={filters.cleanup} reference="the selected application" retry />}
      <ReviewFilterForm key={JSON.stringify(filters)} filters={filters} options={options} showReset={result.rows.length > 0} />
      <p className="admin-mobile-result-count">{result.total} results</p>
      <div className={result.rows.length ? "admin-card admin-mobile-flat" : undefined}>
         <ApplicationTable rows={result.rows} brandAccents={options.brands} initialsOnly emptyUnfiltered={!hasFilters} />
        <div className="admin-table-footer">
        <span>
          {result.total} results · {reviewPageSize} per page
        </span>
        <nav aria-label="Application pages" className="admin-pagination">
           {result.page > 1 ? (
            <a href={pageUrl(result.page - 1)} className="admin-page" aria-label="Previous page">
              ‹
            </a>
           ) : <span className="admin-page is-disabled" aria-label="Previous page" aria-disabled="true">‹</span>}
          {pageWindow(result.page, result.pages).map((value, index, all) => (
            <span key={value} style={{ display: "inline-flex", gap: 6 }}>
              {index > 0 && value - all[index - 1] > 1 && (
                <span className="admin-muted" aria-hidden="true">
                  …
                </span>
              )}
              {value === result.page ? (
                <span className="admin-page" aria-current="page">
                  {value}
                </span>
              ) : (
                <a href={pageUrl(value)} className="admin-page">
                  {value}
                </a>
              )}
            </span>
          ))}
           {result.page < result.pages ? (
            <a href={pageUrl(result.page + 1)} className="admin-page" aria-label="Next page">
              ›
            </a>
           ) : <span className="admin-page is-disabled" aria-label="Next page" aria-disabled="true">›</span>}
        </nav>
        </div>
      </div>
    </section>
  );
}
