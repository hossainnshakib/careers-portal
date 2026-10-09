import { expect, it } from "vitest";
import { adminCookieOptions, adminCookieWriteOptions, adminSessionLifetimeSeconds, isAdminSessionCookie } from "./session-cookies";

it("configures 30-day host-only HttpOnly/SameSite-Lax cookies with root path", () => {
  const options = adminCookieOptions(true);
  expect(options).toEqual({ path: "/", httpOnly: true, sameSite: "lax", secure: true, maxAge: 2592000 });
  expect(options.domain).toBeUndefined();
  expect(adminCookieOptions(false).secure).toBe(false);
});
it("overrides the SDK 400-day writer and slides expiration without modifying token values", () => {
  const now = Date.parse("2026-10-09T00:00:00Z");
  const written = adminCookieWriteOptions({ maxAge: 400 * 86400 }, true, now);
  expect(written.maxAge).toBe(adminSessionLifetimeSeconds);
  expect(written.expires?.getTime()).toBe(now + 2592000000);
  expect(adminCookieWriteOptions({}, true, now + 1000).expires?.getTime()).toBe(written.expires!.getTime() + 1000);
});
it("never resurrects cleared/chunk-removal cookies", () => {
  const cleared = adminCookieWriteOptions({ maxAge: 0 }, true);
  expect(cleared.maxAge).toBe(0); expect(cleared.expires?.getTime()).toBe(0);
});
it("recognizes all session chunks without renewing other project or PKCE cookies", () => {
  const url = "https://example.supabase.co";
  expect(isAdminSessionCookie("sb-example-auth-token", url)).toBe(true);
  expect(isAdminSessionCookie("sb-example-auth-token.10", url)).toBe(true);
  expect(isAdminSessionCookie("sb-other-auth-token", url)).toBe(false);
  expect(isAdminSessionCookie("sb-example-auth-token-code-verifier", url)).toBe(false);
});
