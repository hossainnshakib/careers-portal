import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";

export function getStorageClient() {
  return createClient(
    getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  ).storage;
}
