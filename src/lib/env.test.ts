import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { rootCertificates } from "node:tls";
import { productionProjectRef } from "./maintenance/target";

vi.mock("server-only", () => ({}));
const ref = "d".repeat(20);
beforeEach(() => {
  vi.resetModules();
  for (const key of ["VERCEL", "VERCEL_ENV", "DATABASE_SSL_CA", "NODE_TLS_REJECT_UNAUTHORIZED", "DEV_SUPABASE_PROJECT_REF"]) vi.stubEnv(key, undefined);
  const env = {
    APP_ENV: "development", DEV_SUPABASE_PROJECT_REF: ref,
    NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    DATABASE_URL: `postgres://postgres.${ref}:fixture@aws-0-example.pooler.supabase.com:6543/postgres`,
    DIRECT_URL: `postgres://postgres:fixture@db.${ref}.supabase.co:5432/postgres`,
    SUPABASE_SERVICE_ROLE_KEY: "fixture-only", UPLOAD_SESSION_SECRET: "u".repeat(32),
    CRON_SECRET: "c".repeat(32), TURNSTILE_SECRET_KEY: "fixture-only",
  };
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());
it("requires both targets and the independent DEV pin in development", async () => {
  const { getServerEnv } = await import("./env");
  vi.stubEnv("DEV_SUPABASE_PROJECT_REF", undefined);
  expect(() => getServerEnv()).toThrow("Pin ALLOWED_SUPABASE_PROJECT_REF");
});
it("rejects a production endpoint mislabeled as development", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `https://${productionProjectRef}.supabase.co`);
  const { getServerEnv } = await import("./env");
  expect(() => getServerEnv()).toThrow("forbidden");
});
it("overrides insecure postgres.js defaults with certificate and hostname verification", async () => {
  const { getServerEnv, getDatabaseTlsOptions } = await import("./env");
  expect(getServerEnv().APP_ENV).toBe("development");
  expect(getDatabaseTlsOptions()).toEqual({ rejectUnauthorized: true });
});
it("uses an explicitly provided CA without disabling verification", async () => {
  vi.stubEnv("DATABASE_SSL_CA", rootCertificates[0]);
  const { getDatabaseTlsOptions } = await import("./env");
  expect(getDatabaseTlsOptions()).toEqual({ rejectUnauthorized: true, ca: rootCertificates[0] });
});
it("rejects malformed CA input without putting it in the error", async () => {
  vi.stubEnv("DATABASE_SSL_CA", "private-fixture-invalid-certificate");
  const { getDatabaseTlsOptions } = await import("./env");
  expect(() => getDatabaseTlsOptions()).toThrow("PEM CA certificate");
  try { getDatabaseTlsOptions(); } catch (error) { expect(String(error)).not.toContain("private-fixture-invalid-certificate"); }
});
it("refuses process-wide TLS bypass", async () => {
  vi.stubEnv("NODE_TLS_REJECT_UNAUTHORIZED", "0");
  const { getDatabaseTlsOptions } = await import("./env");
  expect(() => getDatabaseTlsOptions()).toThrow("must not be disabled");
});
