"use server";

import { z } from "zod";
import { AdminAccessError, requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/result";

export async function enrollMfaAction(input: unknown): Promise<ActionResult<{ factorId: string; qr: string; secret: string }>> {
  try {
    await requireAdmin({ allowMfaSetup: true });
    if (!z.strictObject({}).safeParse(input).success) return { ok: false, error: "Invalid enrollment request." };
    const client = await createSupabaseServerClient();
    const listed = await client.auth.mfa.listFactors();
    if (listed.error || listed.data.all.some((factor) => factor.status === "verified")) return { ok: false, error: "Use your existing authenticator to continue." };
    for (const factor of listed.data.all) {
      const removed = await client.auth.mfa.unenroll({ factorId: factor.id });
      if (removed.error) return { ok: false, error: "Unable to prepare enrollment. Try again." };
    }
    const result = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Careers Portal", issuer: "Careers Portal" });
    if (result.error) return { ok: false, error: "Unable to enroll authenticator. Try again." };
    return { ok: true, data: { factorId: result.data.id, qr: result.data.totp.qr_code, secret: result.data.totp.secret } };
  } catch (error) { return { ok: false, error: error instanceof AdminAccessError ? "Administrator access required." : "Unable to enroll authenticator. Check your administrator access." }; }
}
export async function verifyMfaAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin({ allowMfaSetup: true });
    const parsed = z.strictObject({ factorId: z.uuid(), code: z.string().regex(/^\d{6}$/) }).safeParse(input);
    if (!parsed.success) return { ok: false, error: "Enter the six-digit authenticator code." };
    const client = await createSupabaseServerClient();
    const listed = await client.auth.mfa.listFactors();
    if (listed.error || !listed.data.all.some((factor) => factor.id === parsed.data.factorId && factor.factor_type === "totp")) return { ok: false, error: "Unable to verify authenticator." };
    const result = await client.auth.mfa.challengeAndVerify(parsed.data);
    if (result.error) return { ok: false, error: "Unable to verify code. Use a fresh code and try again." };
    await requireAdmin();
    return { ok: true, data: null };
  } catch (error) { return { ok: false, error: error instanceof AdminAccessError ? "Administrator access required." : "Unable to verify authenticator. Try signing in again." }; }
}
