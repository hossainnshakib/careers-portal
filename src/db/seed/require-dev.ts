import "server-only";

import { getDevDatabaseEnv } from "@/lib/env";
import { assertDevTarget } from "./guard";

export function requireDevTarget() {
  const server = getDevDatabaseEnv();
  assertDevTarget({
    appEnv: server.APP_ENV,
    devProjectRef: server.DEV_SUPABASE_PROJECT_REF,
    databaseUrl: server.DATABASE_URL,
    directUrl: server.DIRECT_URL,
    supabaseUrl: server.NEXT_PUBLIC_SUPABASE_URL,
  });
}
