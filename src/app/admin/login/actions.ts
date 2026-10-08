"use server";

import { z } from "zod";
import { AdminAccessError, requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthResult = { ok: true; data: null } | { ok: false; error: string };
const invalid = {
  ok: false,
  error: "Unable to sign in. Check your credentials and access, then try again.",
} as const;
const credentials = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});

/** Public authentication entry point; authorization occurs after password verification. */
export async function login(input: unknown): Promise<AuthResult> {
  const parsed = credentials.safeParse(input);
  if (!parsed.success) return invalid;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return invalid;
    try {
      await requireAdmin({ allowMfaSetup: true });
    } catch {
      await supabase.auth.signOut({ scope: "local" });
      return invalid;
    }
    return { ok: true, data: null };
  } catch {
    return invalid;
  }
}

export async function logout(): Promise<AuthResult> {
  try {
    await requireAdmin({ allowMfaSetup: true });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    return error
      ? { ok: false, error: "Unable to sign out. Try again." }
      : { ok: true, data: null };
  } catch (error) {
    if (error instanceof AdminAccessError)
      return { ok: false, error: "Administrator access required." };
    return { ok: false, error: "Unable to sign out. Try again." };
  }
}
