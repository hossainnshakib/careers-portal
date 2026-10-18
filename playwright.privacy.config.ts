import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

/** Policy-only checks: no account/catalog fixtures, cloud writes or cleanup. */
export default defineConfig({
  ...config,
  testMatch: ["privacy-readonly.spec.ts", "public-pages.spec.ts"],
  globalSetup: undefined,
  globalTeardown: undefined,
  retries: 0,
  use: { ...config.use, trace: "off", screenshot: "off", video: "off" },
});
