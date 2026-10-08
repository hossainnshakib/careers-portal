import "server-only";
import { z } from "zod";
import { requireDevTarget } from "../../src/db/seed/require-dev";
import { getServerEnv } from "../../src/lib/env";

try {
  requireDevTarget();
  const port = process.env.PLAYWRIGHT_PRODUCTION === "1" ? 3100 : 3000;
  const response = await fetch(`http://localhost:${port}/api/cron/daily`, {
    headers: { Authorization: `Bearer ${getServerEnv().CRON_SECRET}` }, signal: AbortSignal.timeout(70_000),
  });
  if (!response.ok) throw new Error("Maintenance failed");
  const counts = z.strictObject({ scannedObjects: z.number().int().nonnegative(), removedObjects: z.number().int().nonnegative() }).parse(await response.json());
  console.info(JSON.stringify(counts));
} catch {
  console.error("Dev cron HTTP check failed.");
  process.exitCode = 1;
}
