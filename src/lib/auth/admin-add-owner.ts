import "server-only";
import { closeDb } from "@/db";
import { allowlistExistingAdminForOwner } from "./admin-add";

try {
  await allowlistExistingAdminForOwner(process.env.ADMIN_EMAIL);
  console.info("Existing Auth account added to the allowed-target admin allowlist.");
} catch {
  console.error("Owner admin setup refused or failed. Check target pins and the existing account.");
  process.exitCode = 1;
} finally { await closeDb(); }
