import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { assertAllowedTarget, assertDeploymentTarget, assertMaintenanceConfirmation, parseDatabaseTarget, productionProjectRef } from "./target";

const dev = "d".repeat(20); const prod = productionProjectRef;
const target = (ref: string, appEnv: string) => ({ appEnv, allowedProjectRef: ref, devProjectRef: appEnv === "production" ? undefined : dev,
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
it("supports conversion with no DEV project, never with a fake or retired DEV pin", () => {
  expect(() => assertAllowedTarget(target(prod, "production"))).not.toThrow();
  for (const devProjectRef of [prod, dev, ""]) expect(() => assertAllowedTarget({ ...target(prod, "production"), devProjectRef })).toThrow();
  expect(() => assertAllowedTarget({ ...target(prod, "development"), devProjectRef: prod })).toThrow();
  expect(() => assertAllowedTarget(target("p".repeat(20), "production"))).toThrow();
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

it.each([
  "?sslmode=disable", "?sslmode=require", "?ssl=false", "?host=attacker.test",
  "?user=attacker", "?options=-c%20search_path%3Devil", "?sslmode=verify-full&sslmode=disable", "#fragment",
])("rejects unsafe or ambiguous connection options %s", suffix => {
  expect(() => parseDatabaseTarget(target(dev, "development").databaseUrl + suffix)).toThrow("Invalid database target");
});
it("parses encoded credentials/restricted roles and refuses malformed password escapes", () => {
  expect(parseDatabaseTarget(`postgresql://careers_runtime.${dev}:a%40b%3Ac%2Fd@aws-0-example.pooler.supabase.com:6543/postgres?sslmode=verify-full`)).toEqual({ ref: dev, transaction: true });
  expect(parseDatabaseTarget(`postgres://careers_owner:fixture@db.${prod}.supabase.co:5432/postgres`)).toEqual({ ref: prod, transaction: false });
  expect(() => parseDatabaseTarget(`postgres://careers_owner:%ZZ@db.${prod}.supabase.co:5432/postgres`)).toThrow("Invalid database target");
  expect(() => parseDatabaseTarget(`postgres://careers_owner:fi\nxture@db.${prod}.supabase.co:5432/postgres`)).toThrow("Invalid database target");
});
it.each([undefined, "not-a-url", `postgres://postgres.%ZZ:fixture@aws-0-example.pooler.supabase.com:5432/postgres`, `postgres://postgres:fixture@db.${dev}.supabase.co.evil.test/postgres`, `postgres://postgres.${dev}:fixture@aws-0-example.pooler.supabase.com:1234/postgres`])("rejects malformed connection strings without exposing their values", value => {
  expect(() => parseDatabaseTarget(value)).toThrow(/^Invalid database target or TLS options\.$/);
});
it("requires session/direct mode for migrations even on the matching project", () => {
  const config = target(prod, "production");
  expect(() => assertAllowedTarget({ ...config, directUrl: config.databaseUrl })).toThrow();
});
it.each(["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL", "DEV_SUPABASE_PROJECT_REF"])("startup rejects production through %s even under explicit development", key => {
  const values = { APP_ENV: "development", [key]: key === "DEV_SUPABASE_PROJECT_REF" ? prod : `https://${prod}.supabase.co` };
  expect(() => assertDeploymentTarget(values)).toThrow("forbidden");
});
it.each(["preview", "development", undefined])("rejects production configuration in Vercel scope %s", VERCEL_ENV => {
  expect(() => assertDeploymentTarget({ APP_ENV: "production", VERCEL: "1", VERCEL_ENV })).toThrow();
});
it("rejects DEV mode on Vercel Production and allows correctly scoped production", () => {
  expect(() => assertDeploymentTarget({ APP_ENV: "development", VERCEL: "1", VERCEL_ENV: "production" })).toThrow();
  expect(() => assertDeploymentTarget({ APP_ENV: "production", VERCEL: "1", VERCEL_ENV: "production" })).not.toThrow();
});
it.each([[], ["--apply"], [`--confirm=${prod}`], ["--apply", `--confirm=${dev}`], ["--apply", `--confirm=${prod}`, "--force"], ["--apply", "--apply"]].map(args => ({ args })))("refuses incomplete/ambiguous write approval $args", ({ args }) => {
  expect(() => assertMaintenanceConfirmation(args, prod)).toThrow("No changes authorized");
});
it("accepts only explicit exact-target apply approval", () => {
  expect(() => assertMaintenanceConfirmation(["--apply", `--confirm=${prod}`], prod)).not.toThrow();
});
