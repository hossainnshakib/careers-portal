import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { SettingsPanels } from "@/components/admin/settings-panels";

export default async function OptionsPage() {
  await requireAdmin().catch(redirectAdminDenial);
  return <SettingsPanels />;
}
