import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";

export default async function ApplicationsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  return (
    <section>
      <h1 className="text-2xl font-bold">Applications</h1>
      <p className="mt-3 text-muted-foreground">Application review will be available in Phase 3.</p>
    </section>
  );
}
