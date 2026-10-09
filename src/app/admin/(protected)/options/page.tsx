import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listJobOptions, optionLinkCounts } from "@/db/queries/job-options";
import { OptionsManager } from "@/components/admin/options-manager";

export default async function OptionsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const rows = await listJobOptions();
  const counts = await optionLinkCounts();
  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold">Options</h1>
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Work arrangement, engagement type and experience labels shown across the site come from
        this list. An option used by jobs cannot be deleted — deactivate it instead; existing
        jobs keep their selection.
      </p>
      <OptionsManager
        rows={rows.map((row) => ({
          id: row.id,
          group: row.group,
          label: row.label,
          slug: row.slug,
          sortOrder: row.sortOrder,
          isActive: row.isActive,
        }))}
        counts={Object.fromEntries([...counts])}
      />
    </section>
  );
}
