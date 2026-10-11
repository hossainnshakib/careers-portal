import { LoginForm } from "@/components/admin/login-form";
import { AdminAuthFrame } from "@/components/admin/admin-auth-frame";
import { redirect } from "next/navigation";
import { AdminAccessError, AdminMfaRequiredError, requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = "force-dynamic";

/** Public login exception: it must be reachable before a user is authorized. */
export default async function LoginPage() {
  try { await requireAdmin(); }
  catch (error) {
    if (error instanceof AdminMfaRequiredError) redirect("/admin/mfa");
    if (!(error instanceof AdminAccessError)) throw error;
    return <AdminAuthFrame><h1 className="admin-kicker">Admin sign in</h1><LoginForm /></AdminAuthFrame>;
  }
  redirect("/admin");
}
