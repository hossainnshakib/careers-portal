import { loadPublicCatalog } from "@/db/queries/public-jobs";
import { isServerEnvConfigured } from "@/lib/env";
import { getPublicContactEmail } from "@/lib/env-public";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const configured = isServerEnvConfigured();
  const brands = configured ? (await loadPublicCatalog().catch(() => { throw new Error("Unable to load careers information."); })).brands : [];
  return <><PublicHeader />{children}<PublicFooter brands={brands} contactEmail={getPublicContactEmail()} /></>;
}
