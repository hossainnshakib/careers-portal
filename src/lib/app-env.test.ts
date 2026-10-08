import { expect, it } from "vitest";
import { appEnvSchema, assertStartupEnvironment, turnstileTestSecretKeys, turnstileTestSiteKeys } from "./app-env";

const environments = [undefined, "", "production", "development", "unexpected"];
const real = { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAExampleRealLookingSiteKey", TURNSTILE_SECRET_KEY: "ExampleRealLookingSecretNotACloudflareDummy" };

it.each(environments)("requires explicit valid APP_ENV=%s at production startup", (APP_ENV) => {
  const valid = APP_ENV === "development" || APP_ENV === "production";
  expect(appEnvSchema.safeParse(APP_ENV).success).toBe(valid);
  const start = () => assertStartupEnvironment({ ...real, APP_ENV }, "production");
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
