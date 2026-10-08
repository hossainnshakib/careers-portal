import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";

test.use({ trace: "off" });
test("daily cron rejects callers without its bearer and returns counts to the dev-guarded caller", async ({ request }) => {
  test.setTimeout(120_000);
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  expect((await request.get("/api/cron/daily", { headers: { Authorization: "Bearer synthetic-wrong-secret" } })).status()).toBe(401);
  let output: string;
  try {
    output = execFileSync(process.execPath, ["--env-file-if-exists=.env.local", "--conditions=react-server", "--import", "tsx", "tests/support/cron-check.ts"], {
      encoding: "utf8", timeout: 90_000, stdio: ["ignore", "pipe", "ignore"],
    });
  } catch { throw new Error("Guarded dev cron behavior check failed."); }
  const counts = JSON.parse(output) as { scannedObjects: number; removedObjects: number };
  expect(counts.scannedObjects).toBeGreaterThanOrEqual(0);
  expect(counts.removedObjects).toBeGreaterThanOrEqual(0);
});
