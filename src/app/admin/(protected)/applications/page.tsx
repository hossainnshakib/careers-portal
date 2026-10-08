import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listReviewApplications, reviewFilterOptions } from "@/db/queries/review";
import { reviewFilters } from "@/lib/validation/review";
import { ApplicationTable } from "@/components/admin/application-table";
import { ReviewFilterForm } from "@/components/admin/review-filters";
import { DeleteApplicationControl } from "@/components/admin/review-controls";

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin().catch(redirectAdminDenial);
  const params = await searchParams;
  const allowed = ["brand", "department", "job", "status", "q", "from", "to", "tz", "sort", "page", "cleanup"];
  const parsed = reviewFilters.safeParse(Object.fromEntries(allowed.filter((key) => params[key] !== undefined).map((key) => [key, params[key]])));
  const filters = parsed.success ? parsed.data : reviewFilters.parse({});
  const result = await listReviewApplications(filters).catch(() => { throw new Error("Unable to load applications."); });
  const options = await reviewFilterOptions().catch(() => { throw new Error("Unable to load applications."); });
  function pageUrl(page: number) {
    const values = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value !== "" && key !== "page" && key !== "cleanup") values.set(key, String(value));
    values.set("page", String(page));
    return `/admin/applications?${values}`;
  }
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Applications</h1>
      {!parsed.success && <p role="status">Invalid filters were cleared.</p>}
      {filters.cleanup && <DeleteApplicationControl applicationId={filters.cleanup} reference="the selected application" retry />}
      <ReviewFilterForm key={JSON.stringify(filters)} filters={filters} options={options} />
      <p>{result.total} applications · Page {result.page} of {result.pages}</p>
      <ApplicationTable rows={result.rows} />
      <nav aria-label="Application pages" className="flex gap-6">
        {result.page > 1 && <a href={pageUrl(result.page - 1)} className="underline">Previous page</a>}
        {result.page < result.pages && <a href={pageUrl(result.page + 1)} className="underline">Next page</a>}
      </nav>
    </section>
  );
}
