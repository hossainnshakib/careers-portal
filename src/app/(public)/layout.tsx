import { loadPublicCatalog } from "@/db/queries/public-jobs";
import { getPublicEnv, isServerEnvConfigured } from "@/lib/env";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const configured = isServerEnvConfigured();
  const brands = configured ? (await loadPublicCatalog().catch(() => { throw new Error("Unable to load careers information."); })).brands : [];
  return <><PublicHeader />{children}<PublicFooter brands={brands} contactEmail={configured ? getPublicEnv().NEXT_PUBLIC_CONTACT_EMAIL : undefined} /></>;
}
