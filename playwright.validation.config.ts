import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

/** Non-persisting validation checks: no account/catalog setup, sweeps or cleanup. */
export default defineConfig({
  ...config,
  testMatch: "application-validation.spec.ts",
  globalSetup: undefined,
  globalTeardown: undefined,
  retries: 0,
  use: { ...config.use, trace: "off", screenshot: "off", video: "off" },
});
