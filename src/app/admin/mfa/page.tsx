import { AdminMfaRequiredError, requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MfaForm } from "@/components/admin/mfa-form";
import { LogoutButton } from "@/components/admin/logout-button";
import { AdminAuthFrame } from "@/components/admin/admin-auth-frame";

export const dynamic = "force-dynamic";
export default async function MfaPage() {
  await requireAdmin({ allowMfaSetup: true }).catch(redirectAdminDenial);
  let complete = false;
  try { await requireAdmin(); complete = true; }
  catch (error) { if (!(error instanceof AdminMfaRequiredError)) redirectAdminDenial(error); }
  if (complete) redirect("/admin");
  const client = await createSupabaseServerClient();
  const factors = await client.auth.mfa.listFactors();
  if (factors.error) throw new Error("Unable to load administrator security settings.");
  return <AdminAuthFrame>
    <p className="sr-only">An authenticator code is required before accessing applications or administration.</p>
    <MfaForm factors={factors.data.totp.filter((factor) => factor.status === "verified").map((factor) => ({ id: factor.id, name: factor.friendly_name ?? "Authenticator" }))} />
    <LogoutButton />
  </AdminAuthFrame>;
}
