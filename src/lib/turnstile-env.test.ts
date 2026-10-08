import { afterEach, expect, it, vi } from "vitest";
import { turnstileTestSecretKeys, turnstileTestSiteKeys } from "./app-env";

vi.mock("server-only", () => ({}));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const real = { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAExampleRealLookingSiteKey", TURNSTILE_SECRET_KEY: "ExampleRealLookingSecretNotACloudflareDummy" };

async function verify(APP_ENV: string | undefined, keys = real) {
  vi.resetModules();
  for (const [name, value] of Object.entries({
    APP_ENV, ...keys, SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role",
    DATABASE_URL: "postgres://fixture:fixture@db.example.test/postgres",
    DIRECT_URL: "postgres://fixture:fixture@db.example.test/postgres",
    UPLOAD_SESSION_SECRET: "x".repeat(32), CRON_SECRET: "y".repeat(32),
    NEXT_PUBLIC_SITE_URL: "https://careers.example.test", NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon",
  })) vi.stubEnv(name, value);
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "careers.example.test", action: "careers" })));
  vi.stubGlobal("fetch", fetcher);
  const { verifyTurnstile } = await import("./turnstile");
  return { accepted: await verifyTurnstile("synthetic-token"), fetcher };
}

for (const APP_ENV of [undefined, "", "production", "development", "unexpected"]) {
  it(`real-looking keys fail closed with invalid APP_ENV=${String(APP_ENV)}`, async () => {
    const { accepted, fetcher } = await verify(APP_ENV);
    const valid = APP_ENV === "development" || APP_ENV === "production";
    expect(accepted).toBe(valid);
    expect(fetcher).toHaveBeenCalledTimes(valid ? 1 : 0);
  });
  for (const [name, keys] of [["NEXT_PUBLIC_TURNSTILE_SITE_KEY", turnstileTestSiteKeys], ["TURNSTILE_SECRET_KEY", turnstileTestSecretKeys]] as const) {
    it.each([...keys])(`rejects ${name}=%s with APP_ENV=${String(APP_ENV)} unless explicit development`, async (key) => {
      const { accepted, fetcher } = await verify(APP_ENV, { ...real, [name]: key });
      expect(accepted).toBe(APP_ENV === "development");
      expect(fetcher).toHaveBeenCalledTimes(APP_ENV === "development" ? 1 : 0);
    });
  }
}
