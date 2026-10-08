import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listBrands } from "@/db/queries/brands";
import { BrandManager } from "@/components/admin/brand-manager";

export default async function BrandsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const rows = await listBrands();
  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Brands</h1>
      <BrandManager rows={rows} />
    </section>
  );
}
