import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env-public";

/** Middleware refreshes cookies before Server Components render. */
export async function createSupabaseServerClient() {
  const store = await cookies();
  const env = getPublicEnv();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: new URL(env.NEXT_PUBLIC_SITE_URL).protocol === "https:" },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          for (const { name, value, options } of values) store.set(name, value, options);
        } catch (error) {
          // Next.js Server Components have a read-only cookie store. Middleware
          // handles refresh there; unexpected failures must still propagate.
          if (!(error instanceof Error) || !error.message.includes("Cookies can only be modified"))
            throw error;
        }
      },
    },
  });
}
