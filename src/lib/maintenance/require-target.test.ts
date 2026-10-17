import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { productionProjectRef as ref } from "./target";
const mocks = vi.hoisted(() => ({ env: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getOwnerMaintenanceEnv: mocks.env }));
import { requireAllowedTarget, requireConversionCleanupTarget } from "./require-target";
const originalArgv = process.argv;
beforeEach(() => {
  vi.stubEnv("APP_ENV", "production"); vi.stubEnv("VERCEL", undefined);
  mocks.env.mockReturnValue({ APP_ENV: "production", ALLOWED_SUPABASE_PROJECT_REF: ref,
    NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    DATABASE_URL: `postgres://postgres.${ref}:fixture@aws-0-example.pooler.supabase.com:6543/postgres`,
    DIRECT_URL: `postgres://postgres:fixture@db.${ref}.supabase.co:5432/postgres` });
  process.argv = [process.execPath, "fixture.ts"];
});
afterEach(() => { process.argv = originalArgv; vi.unstubAllEnvs(); });
it("owner reads do not imply write authorization", () => {
  expect(() => requireAllowedTarget()).not.toThrow();
  expect(() => requireAllowedTarget({ write: true })).toThrow("No changes authorized");
  expect(() => requireAllowedTarget({ write: true, args: ["--apply", `--confirm=${ref}`] })).not.toThrow();
});
it("conversion cleanup requires a separate CLI flag and production mode, even with valid owner variables", () => {
  expect(() => requireConversionCleanupTarget()).toThrow("explicit command flag");
  process.argv.push("--owner-conversion");
  expect(() => requireConversionCleanupTarget()).not.toThrow();
  expect(() => requireConversionCleanupTarget(true)).toThrow("No changes authorized");
  process.argv.push("--apply", `--confirm=${ref}`);
  expect(() => requireConversionCleanupTarget(true)).not.toThrow();
  vi.stubEnv("APP_ENV", "development");
  expect(() => requireConversionCleanupTarget(true)).toThrow();
});
it("owner confirmation cannot override a mixed database target or a retired DEV pin", () => {
  const original = mocks.env();
  for (const overrides of [{ DEV_SUPABASE_PROJECT_REF: ref }, { DIRECT_URL: original.DIRECT_URL.replace(ref, "d".repeat(20)) }]) {
    mocks.env.mockReturnValue({ ...original, ...overrides });
    expect(() => requireAllowedTarget({ write: true, args: ["--apply", `--confirm=${ref}`] })).toThrow();
  }
});
