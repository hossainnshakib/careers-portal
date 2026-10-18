import "server-only";

import { closeDb } from "@/db";
import { runValidationDemo } from "@/db/queries/validation-demo";
import { parseDemoCommand } from "./validation-policy";

try {
  const { operation, write } = parseDemoCommand(process.argv.slice(2));
  const result = await runValidationDemo(operation, write);
  console.info(JSON.stringify(result));
  if (result.blocked) {
    console.error("Cleanup refused: delete synthetic applications through the existing authorized admin workflow first. No job or application was removed.");
    process.exitCode = 1;
  }
  console.info("CLI changes do not invalidate deployed Next.js caches; allow up to 300 seconds for catalog refresh. Application routes reload visibility directly.");
} catch {
  // Never print driver/provider exceptions or applicant data.
  console.error("DEMO operation refused or failed. Verify DEV target, exact confirmation, dataset ownership and zero applications. If applications exist, resolve synthetic records through the authorized admin deletion workflow first. No unrelated rows are eligible for cleanup.");
  process.exitCode = 1;
} finally {
  await closeDb();
}
