import "server-only";
import { getOwnerMaintenanceEnv } from "@/lib/env";
import { assertAllowedTarget } from "./target";

export function requireAllowedTarget() {
  const env = getOwnerMaintenanceEnv();
  assertAllowedTarget({ appEnv: env.APP_ENV, allowedProjectRef: env.ALLOWED_SUPABASE_PROJECT_REF,
    devProjectRef: env.DEV_SUPABASE_PROJECT_REF, databaseUrl: env.DATABASE_URL,
    directUrl: env.DIRECT_URL, supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL });
}
