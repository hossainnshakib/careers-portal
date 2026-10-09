import { AdminMfaRequiredError, requireAdmin } from "@/lib/auth/requireAdmin";
import { redirect } from "next/navigation";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MfaForm } from "@/components/admin/mfa-form";
import { LogoutButton } from "@/components/admin/logout-button";

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
  return <main id="main" className="mx-auto max-w-lg space-y-6 px-5 py-12">
    <h1 className="text-3xl font-semibold">Administrator security</h1>
    <p>An authenticator code is required before accessing applications or administration.</p>
    <MfaForm factors={factors.data.totp.filter((factor) => factor.status === "verified").map((factor) => ({ id: factor.id, name: factor.friendly_name ?? "Authenticator" }))} />
    <LogoutButton />
  </main>;
}
