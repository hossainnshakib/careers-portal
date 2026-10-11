import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listBrands } from "@/db/queries/brands";
import { BrandManager } from "@/components/admin/brand-manager";
import { AdminToolbar } from "@/components/admin/admin-toolbar";

export default async function BrandsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const rows = await listBrands();
  return (
    <section>
      <AdminToolbar eyebrow="Brands" title="Brands" />
      <BrandManager rows={rows} />
    </section>
  );
}
