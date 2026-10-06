import "server-only";

import { z } from "zod";
import { getPublicEnv, getServerEnv } from "@/lib/env";

const resultSchema = z.object({ success: z.boolean(), hostname: z.string().optional(), action: z.string().optional() });
const testSecrets = new Set(["1x0000000000000000000000000000000AA", "2x0000000000000000000000000000000AA", "3x0000000000000000000000000000000AA"]);
export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!z.string().min(1).max(2048).safeParse(token).success) return false;
  try {
    const env = getServerEnv();
    const test = testSecrets.has(env.TURNSTILE_SECRET_KEY);
    if (test && env.APP_ENV !== "development") return false;
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
      signal: AbortSignal.timeout(10000), cache: "no-store",
    });
    if (!response.ok) return false;
    const parsed = resultSchema.safeParse(await response.json());
    if (!parsed.success || !parsed.data.success) return false;
    return test || (parsed.data.hostname === new URL(getPublicEnv().NEXT_PUBLIC_SITE_URL).hostname && parsed.data.action === "careers");
  } catch { return false; }
}
