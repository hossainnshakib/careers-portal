import "server-only";
import { requireAllowedTarget } from "@/lib/maintenance/require-target";
import { ensureBuckets } from "./ensure-buckets";

try {
  requireAllowedTarget();
  await ensureBuckets();
  console.info("Allowed-target Storage buckets configured.");
} catch {
  console.error("Owner Storage setup refused or failed. Check the allowed target and bucket visibility.");
  process.exitCode = 1;
}
