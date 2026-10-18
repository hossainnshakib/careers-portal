import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { JobImporter } from "@/components/admin/job-importer";

export default async function ImportJobsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  return <section>
    <AdminToolbar eyebrow="Jobs" eyebrowHref="/admin/jobs" title="Import jobs" />
    <JobImporter />
  </section>;
}
