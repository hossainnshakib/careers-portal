import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listJobOptions, optionLinkCounts } from "@/db/queries/job-options";
import { OptionsManager } from "@/components/admin/options-manager";
import { AdminToolbar } from "@/components/admin/admin-toolbar";

export default async function OptionsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const rows = await listJobOptions();
  const counts = await optionLinkCounts();
  return (
    <section>
      <AdminToolbar eyebrow="Settings" title="Options" />
      <p className="admin-note" style={{ margin: "0 0 14px", maxWidth: 760 }}>
        Work arrangement, engagement type and experience labels shown across the site come from
        this list. An option used by jobs cannot be deleted — deactivate it instead; existing jobs
        keep their selection.
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
