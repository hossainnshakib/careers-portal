import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { productionProjectRef as ref } from "./target";

const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/(SUPABASE|DATABASE|DIRECT_URL|SECRET|TOKEN|PASSWORD|KEY|CREDENTIAL|APP_ENV|ADMIN_EMAIL|VERCEL|RUN_SUPABASE|NODE_TLS)/i.test(key)));
const fixture = {
  NODE_ENV: "test" as const, NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
  DATABASE_URL: `postgres://postgres.${ref}:fixture@aws-0-example.pooler.supabase.com:6543/postgres`,
  DIRECT_URL: `postgres://postgres:fixture@db.${ref}.supabase.co:5432/postgres`,
  SUPABASE_SERVICE_ROLE_KEY: "fixture-only", UPLOAD_SESSION_SECRET: "u".repeat(32),
  CRON_SECRET: "c".repeat(32), TURNSTILE_SECRET_KEY: "fixture-only",
};
function refused(file: string, args: string[], owner = false) {
  // A test bug must not result in real I/O, even with accidentally inherited keys.
  const script = `import net from 'node:net';
    net.Socket.prototype.connect = function () { console.error('NETWORK_ATTEMPT'); throw new Error('Test forbids network'); };
    globalThis.fetch = async () => { console.error('NETWORK_ATTEMPT'); throw new Error('Test forbids fetch'); };
    process.argv = [process.execPath, ${JSON.stringify(resolve(file))}, ...${JSON.stringify(args)}];
    await import(${JSON.stringify(new URL(`../../../${file}`, import.meta.url).href)});`;
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", script], {
    cwd: process.cwd(), encoding: "utf8", timeout: 15000,
    env: { ...environment, ...fixture, APP_ENV: owner ? "production" : "development",
      ...(owner ? { ALLOWED_SUPABASE_PROJECT_REF: ref, ADMIN_EMAIL: "fixture@example.test" } : { DEV_SUPABASE_PROJECT_REF: ref }) },
  });
  expect(result.error).toBeUndefined(); expect(result.status).toBe(1);
  expect(result.stdout).toBe("");
  expect(result.stderr).not.toContain("NETWORK_ATTEMPT");
  expect(result.stderr).not.toMatch(/fixture@|postgres:\/\/|sb_secret_/);
  expect(result.stderr).toMatch(/refused|failed/i);
}
it.each([
  ["src/db/seed/demo.ts", []], ["src/db/seed/reset.ts", []], ["src/db/seed/wipe-demo.ts", []],
  ["src/db/seed/import-real.ts", []], ["src/db/seed/base.ts", []], ["src/db/migrate.ts", []],
  ["src/lib/auth/admin-add.ts", ["fixture@example.test"]], ["src/lib/storage/ensure-buckets.ts", []],
  ["src/db/seed/validation.ts", ["seed", "--write", `--confirm=${ref}`]],
  ["src/db/seed/validation.ts", ["publish", "--write", `--confirm=${ref}`]],
  ["src/db/seed/validation.ts", ["cleanup", "--write", `--confirm=${ref}`]],
  ["scripts/cleanup-demo-artifacts.ts", ["--apply", `--confirm=${ref}`]],
  ["src/db/sweep-test-accounts.ts", []], ["src/db/keepalive.ts", []],
] as [string, string[]][]) ("%s refuses production even when all DEV variables agree", (file, args) => refused(file, args));
it.each([
  ["src/db/owner-setup.ts", ["migrate"]], ["src/db/owner-setup.ts", ["base"]],
  ["src/db/job-shells.ts", []], ["src/lib/auth/admin-add-owner.ts", []],
  ["src/lib/storage/ensure-buckets-owner.ts", []],
] as [string, string[]][]) ("%s refuses owner mutations without explicit apply confirmation", (file, args) => refused(file, args, true));
