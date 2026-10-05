import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";

export default async function DashboardPage() {
  await requireAdmin().catch(redirectAdminDenial);
  return (
    <section>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-3 text-muted-foreground">
        Manage jobs, brands and departments using the navigation. Application counts will be
        available with application review.
      </p>
    </section>
  );
}
