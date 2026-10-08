import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getPublicContactEmail, getPublicSiteUrl } from "@/lib/env-public";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined); vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", undefined);
  vi.stubEnv("VERCEL", undefined); vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined); vi.stubEnv("VERCEL_URL", undefined);
});
afterEach(() => { vi.unstubAllEnvs(); });
it("uses localhost for unconfigured metadata, without needing database credentials", () => {
  expect(getPublicSiteUrl()).toBe("http://localhost:3000");
  expect(getPublicContactEmail()).toBeUndefined();
});
it("accepts HTTP local development and HTTPS deployment URLs", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3100/"); expect(getPublicSiteUrl()).toBe("http://localhost:3100");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://careers.example.test/"); expect(getPublicSiteUrl()).toBe("https://careers.example.test");
});
it.each(["javascript:alert(1)", "ftp://example.test", "not-a-url"])("rejects an invalid metadata origin without reflecting it", (value) => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
  expect(() => getPublicSiteUrl()).toThrow("Invalid public site URL setting.");
});
it("uses an optional validated contact setting without inventing an owner address", () => {
  vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", ""); expect(getPublicContactEmail()).toBeUndefined();
  vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "contact@example.test"); expect(getPublicContactEmail()).toBe("contact@example.test");
  vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "<script>invalid</script>"); expect(() => getPublicContactEmail()).toThrow("Invalid public contact email setting.");
});
