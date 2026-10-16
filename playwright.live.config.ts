import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

/** Deliberately not a generic remote override: only the owner-approved DEV URL. */
export default defineConfig({
  ...config,
  testMatch: "demo-validation.spec.ts",
  grep: /synthetic DEMO applies/,
  retries: 0,
  globalSetup: "./tests/support/live-setup.ts",
  webServer: undefined,
  use: { ...config.use, baseURL: "https://careers-portal-sigma.vercel.app", trace: "off" },
});
