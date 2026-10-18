import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { approvedDemoProject } from "./validation-policy";

it.each(["seed", "publish", "cleanup"])("%s CLI refuses production before connection or mutation", operation => {
  const result = spawnSync(process.execPath, [
    "--conditions=react-server", "--import", "tsx", fileURLToPath(new URL("validation.ts", import.meta.url)),
    operation, "--write", `--confirm=${approvedDemoProject}`,
  ], { env: { ...process.env, APP_ENV: "production", DEV_SUPABASE_PROJECT_REF: approvedDemoProject,
    DATABASE_URL: `postgres://postgres.${approvedDemoProject}:synthetic-password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    DIRECT_URL: `postgres://postgres.${approvedDemoProject}:synthetic-password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    NEXT_PUBLIC_SUPABASE_URL: `https://${approvedDemoProject}.supabase.co`,
  }, encoding: "utf8", timeout: 15000 });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("DEMO operation refused or failed");
  expect(result.stderr).not.toMatch(/synthetic-password|postgres:\/\//);
}, 20000);
