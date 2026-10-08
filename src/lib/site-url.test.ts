import { expect, it, vi } from "vitest";
import { resolveSiteUrl } from "./site-url";

it("prefers the explicit origin over both Vercel URLs", () => {
  expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://explicit.example.test/", VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "production.example.test", VERCEL_URL: "preview.example.test" })).toBe("https://explicit.example.test");
});
it("prefers Vercel project production URL and falls back to deployment URL", () => {
  expect(resolveSiteUrl({ VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "production.example.test", VERCEL_URL: "preview.example.test" })).toBe("https://production.example.test");
  expect(resolveSiteUrl({ VERCEL: "1", VERCEL_URL: "preview.example.test" })).toBe("https://preview.example.test");
});
it("uses localhost outside Vercel or without any supplied origin", () => {
  expect(resolveSiteUrl({ VERCEL_URL: "stale.example.test" })).toBe("http://localhost:3000");
  expect(resolveSiteUrl({ VERCEL: "1" })).toBe("http://localhost:3000");
  expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "", VERCEL: "1", VERCEL_URL: "preview.example.test" })).toBe("https://preview.example.test");
});
it.each(["javascript:alert(1)", "ftp://example.test", "https://user:password@example.test", "https://example.test/path", "https://example.test/?token=private"])("rejects malformed explicit values instead of silently falling through", value => {
  expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: value, VERCEL: "1", VERCEL_URL: "preview.example.test" })).toThrow();
});
it("rejects malformed platform hostnames without reflecting them", () => {
  expect(() => resolveSiteUrl({ VERCEL: "1", VERCEL_URL: "preview.example.test/path" })).toThrow();
});
it("validates public environment settings on Vercel without an explicit site URL", async () => {
  vi.resetModules();
  try {
    for (const [name, value] of Object.entries({ NEXT_PUBLIC_SITE_URL: undefined, VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: undefined,
      VERCEL_URL: "preview.example.test", NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-public-key", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "synthetic-site-key", NEXT_PUBLIC_CONTACT_EMAIL: undefined })) vi.stubEnv(name, value);
    const { getPublicEnv } = await import("./env-public");
    expect(getPublicEnv().NEXT_PUBLIC_SITE_URL).toBe("https://preview.example.test");
  } finally { vi.unstubAllEnvs(); }
});
