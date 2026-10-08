import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { assertAllowedTarget } from "./target";

const dev = "d".repeat(20); const prod = "p".repeat(20);
const target = (ref: string, appEnv: string) => ({ appEnv, allowedProjectRef: ref, devProjectRef: dev,
  supabaseUrl: `https://${ref}.supabase.co`, databaseUrl: `postgres://postgres.${ref}:fixture@aws-0-example.pooler.supabase.com:6543/postgres`,
  directUrl: `postgres://postgres:fixture@db.${ref}.supabase.co/postgres` });
it("accepts only independently pinned, environment-consistent dev or owner production targets", () => {
  expect(() => assertAllowedTarget(target(dev, "development"))).not.toThrow();
  expect(() => assertAllowedTarget(target(prod, "production"))).not.toThrow();
});
it.each([undefined, "", "preview"])("refuses APP_ENV=%s", appEnv => {
  expect(() => assertAllowedTarget({ ...target(dev, "development"), appEnv })).toThrow();
});
it("never reclassifies dev as production or permits a non-dev development target", () => {
  expect(() => assertAllowedTarget(target(dev, "production"))).toThrow();
  expect(() => assertAllowedTarget(target(prod, "development"))).toThrow();
});
it.each(["allowedProjectRef", "devProjectRef", "databaseUrl", "directUrl", "supabaseUrl"] as const)("requires %s before maintenance", key => {
  expect(() => assertAllowedTarget({ ...target(dev, "development"), [key]: undefined })).toThrow();
});
it.each([
  { supabaseUrl: `https://${dev}.supabase.co.evil.test` },
  { supabaseUrl: `http://${dev}.supabase.co` },
  { databaseUrl: `postgres://postgres.${prod}:fixture@aws-0-example.pooler.supabase.com:6543/postgres` },
  { directUrl: `postgres://postgres:fixture@db.${prod}.supabase.co/postgres` },
  { directUrl: `postgres://postgres:fixture@db.${dev}.supabase.co/other` },
])("refuses mismatched or lookalike connection targets", overrides => {
  expect(() => assertAllowedTarget({ ...target(dev, "development"), ...overrides })).toThrow();
});
it("the actual draft-shell CLI refuses missing target approval before connecting", () => {
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/(SUPABASE|DATABASE|DIRECT_URL|SECRET|TOKEN|PASSWORD|KEY|CREDENTIAL|APP_ENV|ADMIN_EMAIL)/i.test(key)));
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "src/db/job-shells.ts"], {
    cwd: process.cwd(), encoding: "utf8", timeout: 15000,
    env: { ...environment, NODE_ENV: "test", APP_ENV: "development", DEV_SUPABASE_PROJECT_REF: dev,
      NEXT_PUBLIC_SUPABASE_URL: `https://${dev}.supabase.co`, DATABASE_URL: target(dev, "development").databaseUrl,
      DIRECT_URL: target(dev, "development").directUrl },
  });
  expect(result.status).toBe(1); expect(result.stdout).toBe(""); expect(result.stderr).toContain("refused or failed");
});
