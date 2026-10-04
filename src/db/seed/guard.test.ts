import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertDevTarget } from "./guard";

const ref = "abcdefghijklmnopqrst";
const valid = {
  appEnv: "development",
  devProjectRef: ref,
  supabaseUrl: `https://${ref}.supabase.co`,
  databaseUrl: `postgres://postgres.${ref}:fake@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  directUrl: `postgres://postgres:fake@db.${ref}.supabase.co:5432/postgres`,
};
describe("demo/reset production guard", () => {
  it("allows the pinned dev project including its transaction pooler", () => {
    expect(() => assertDevTarget(valid)).not.toThrow();
  });
  it.each(["production", undefined, "preview"])("refuses APP_ENV=%s", (appEnv) => {
    expect(() => assertDevTarget({ ...valid, appEnv })).toThrow();
  });
  it("refuses a production database even when APP_ENV is development", () => {
    expect(() =>
      assertDevTarget({
        ...valid,
        databaseUrl: "postgres://postgres:fake@db.zyxwvutsrqponmlkjihg.supabase.co/postgres",
      }),
    ).toThrow();
  });
  it("checks DIRECT_URL as well as DATABASE_URL", () => {
    expect(() =>
      assertDevTarget({ ...valid, directUrl: "postgres://postgres:fake@localhost/postgres" }),
    ).toThrow();
  });
  it("requires an independent project pin", () => {
    expect(() => assertDevTarget({ ...valid, devProjectRef: undefined })).toThrow();
  });
  it("rejects lookalike hosts and different pooler tenants", () => {
    expect(() =>
      assertDevTarget({
        ...valid,
        directUrl: `postgres://postgres:fake@db.${ref}.supabase.co.attacker.test/postgres`,
      }),
    ).toThrow();
    expect(() =>
      assertDevTarget({
        ...valid,
        databaseUrl:
          "postgres://postgres.zyxwvutsrqponmlkjihg:fake@aws-0-ap-southeast-1.pooler.supabase.com/postgres",
      }),
    ).toThrow();
  });
  it.each(["demo.ts", "reset.ts"])("%s CLI refuses production before connecting", (file) => {
    const result = spawnSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        fileURLToPath(new URL(file, import.meta.url)),
      ],
      {
        env: {
          ...process.env,
          APP_ENV: "production",
          DEV_SUPABASE_PROJECT_REF: ref,
          DATABASE_URL: valid.databaseUrl,
          DIRECT_URL: valid.directUrl,
          NEXT_PUBLIC_SUPABASE_URL: valid.supabaseUrl,
        },
        encoding: "utf8",
        timeout: 15_000,
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/failed or was refused/);
    expect(result.stderr).not.toMatch(/fake@|postgres:\/\//);
  });
});
