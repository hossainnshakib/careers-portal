import "server-only";

import { z } from "zod";
import { isTurnstileTestSecretKey, isTurnstileTestSiteKey } from "@/lib/app-env";
import { getPublicEnv, getServerEnv } from "@/lib/env";

const resultSchema = z.object({ success: z.boolean(), hostname: z.string().optional(), action: z.string().optional() });

export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!z.string().min(1).max(2048).safeParse(token).success) return false;
  try {
    const env = getServerEnv();
    // Cloudflare's documented test keys include always-pass values and are only allowed
    // when APP_ENV explicitly says development. The check reads the key values
    // themselves, not only APP_ENV: a production deployment that is handed a
    // test site key or secret key fails closed here before any network call.
    const testSecret = isTurnstileTestSecretKey(env.TURNSTILE_SECRET_KEY);
    if ((testSecret || isTurnstileTestSiteKey(getPublicEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY)) && env.APP_ENV !== "development")
      return false;
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
      signal: AbortSignal.timeout(10000), cache: "no-store",
    });
    if (!response.ok) return false;
    const parsed = resultSchema.safeParse(await response.json());
    if (!parsed.success || !parsed.data.success) return false;
    return testSecret || (parsed.data.hostname === new URL(getPublicEnv().NEXT_PUBLIC_SITE_URL).hostname && parsed.data.action === "careers");
  } catch { return false; }
}
