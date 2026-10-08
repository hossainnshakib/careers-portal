import { beforeEach, expect, it, vi } from "vitest";
const env = vi.hoisted(() => ({ APP_ENV: "development", TURNSTILE_SECRET_KEY: "real-test-fixture-secret" }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getServerEnv: () => env, getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://careers.example.test" }) }));
import { verifyTurnstile } from "./turnstile";
beforeEach(() => { env.APP_ENV = "development"; env.TURNSTILE_SECRET_KEY = "real-test-fixture-secret"; vi.stubGlobal("fetch", vi.fn()); });
it.each([
  { success: false }, { success: true, hostname: "attacker.test", action: "careers" },
  { success: true, hostname: "careers.example.test", action: "wrong-action" },
])("rejects failed checks or wrong hostname/action", async (data) => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(data)));
  expect(await verifyTurnstile("token")).toBe(false);
});
it("accepts validated checks and fails closed on infrastructure errors", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "careers.example.test", action: "careers" })));
  expect(await verifyTurnstile("token")).toBe(true);
  vi.mocked(fetch).mockRejectedValue(new Error("Network failure")); expect(await verifyTurnstile("token")).toBe(false);
});
it("refuses Cloudflare test secrets in production", async () => {
  env.APP_ENV = "production"; env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
  expect(await verifyTurnstile("token")).toBe(false); expect(fetch).not.toHaveBeenCalled();
});
