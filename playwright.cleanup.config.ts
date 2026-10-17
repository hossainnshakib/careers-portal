import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

/** Intentionally no account/catalog fixtures, seed, sweep, deletion or upload. */
export default defineConfig({
  ...config,
  testMatch: ["cleanup-readonly.spec.ts", "production-hardening-readonly.spec.ts"],
  globalSetup: undefined,
  globalTeardown: undefined,
  retries: 0,
  use: { ...config.use, trace: "off", screenshot: "off", video: "off" },
});
