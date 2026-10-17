import { expect, it } from "vitest";
import { appEnvSchema, assertStartupEnvironment, turnstileTestSecretKeys, turnstileTestSiteKeys } from "./app-env";
import { productionProjectRef as ref } from "./maintenance/target";

const environments = [undefined, "", "production", "development", "unexpected"];
const real = { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAExampleRealLookingSiteKey", TURNSTILE_SECRET_KEY: "ExampleRealLookingSecretNotACloudflareDummy" };
const production = {
  SUPABASE_SERVICE_ROLE_KEY: "fixture-only", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-only",
  UPLOAD_SESSION_SECRET: "u".repeat(32), CRON_SECRET: "c".repeat(32),
  NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`, NEXT_PUBLIC_SITE_URL: "https://careers.fixenmedia.com",
  DATABASE_URL: `postgres://postgres.${ref}:fixture@aws-0-example.pooler.supabase.com:6543/postgres`,
  DIRECT_URL: `postgres://postgres:fixture@db.${ref}.supabase.co:5432/postgres`,
};

it.each(environments)("requires explicit valid APP_ENV=%s at production startup", (APP_ENV) => {
  const valid = APP_ENV === "development" || APP_ENV === "production";
  expect(appEnvSchema.safeParse(APP_ENV).success).toBe(valid);
  const start = () => assertStartupEnvironment({ ...real, ...(APP_ENV === "production" ? production : {}), APP_ENV }, "production");
  if (valid) expect(start).not.toThrow();
  else expect(start).toThrow("APP_ENV must be set explicitly");
});
for (const APP_ENV of environments) {
  for (const [name, keys] of [["NEXT_PUBLIC_TURNSTILE_SITE_KEY", turnstileTestSiteKeys], ["TURNSTILE_SECRET_KEY", turnstileTestSecretKeys]] as const) {
    it.each([...keys])(`production startup rejects ${name}=%s unless APP_ENV=${String(APP_ENV)} is explicit development`, (key) => {
      const start = () => assertStartupEnvironment({ ...real, APP_ENV, [name]: key }, "production");
      if (APP_ENV === "development") expect(start).not.toThrow();
      else expect(start).toThrow(/Refusing to start/);
    });
  }
}
it("production startup requires matching database identities and the final canonical origin", () => {
  const env = { ...real, ...production, APP_ENV: "production" };
  expect(() => assertStartupEnvironment(env, "production")).not.toThrow();
  for (const key of ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SITE_URL"])
    expect(() => assertStartupEnvironment({ ...env, [key]: undefined }, "production")).toThrow();
  for (const key of ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "TURNSTILE_SECRET_KEY", "UPLOAD_SESSION_SECRET", "CRON_SECRET"])
    expect(() => assertStartupEnvironment({ ...env, [key]: undefined }, "production")).toThrow();
});
