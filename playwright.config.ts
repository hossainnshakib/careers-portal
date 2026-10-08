import { defineConfig, devices } from "@playwright/test";

const production = process.env.PLAYWRIGHT_PRODUCTION === "1";
const PORT = production ? 3100 : 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/support/sweep-accounts.ts",
  globalTeardown: "./tests/support/sweep-accounts.ts",
  fullyParallel: false,
  workers: 1,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: production ? "pnpm start --port 3100" : "pnpm dev",
    url: `${baseURL}/api/health`,
    reuseExistingServer: production ? false : !process.env.CI,
    timeout: 120_000,
  },
});
