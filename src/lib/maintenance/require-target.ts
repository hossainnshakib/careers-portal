import "server-only";
import { getOwnerMaintenanceEnv } from "@/lib/env";
import { assertAllowedTarget, assertDeploymentTarget, assertMaintenanceConfirmation } from "./target";

export function requireAllowedTarget(options?: { write: true; args?: readonly string[] }) {
  assertDeploymentTarget(process.env);
  const env = getOwnerMaintenanceEnv();
  assertAllowedTarget({ appEnv: env.APP_ENV, allowedProjectRef: env.ALLOWED_SUPABASE_PROJECT_REF,
    devProjectRef: env.DEV_SUPABASE_PROJECT_REF, databaseUrl: env.DATABASE_URL,
    directUrl: env.DIRECT_URL, supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL });
  if (options?.write) assertMaintenanceConfirmation(options.args ?? process.argv.slice(2), env.ALLOWED_SUPABASE_PROJECT_REF);
}

/** Separate owner-only one-off path; never reclassifies a DEV command as production. */
export function requireConversionCleanupTarget(write = false) {
  if (process.env.APP_ENV !== "production" || process.argv.filter(arg => arg === "--owner-conversion").length !== 1)
    throw new Error("Owner conversion cleanup requires production mode and its explicit command flag.");
  const args = process.argv.slice(2).filter(arg => arg === "--apply" || arg.startsWith("--confirm="));
  requireAllowedTarget(write ? { write: true, args } : undefined);
}
