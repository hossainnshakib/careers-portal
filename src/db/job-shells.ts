import "server-only";
import { closeDb } from "./index";
import { seedJobShells } from "./queries/job-shells";

try {
  const counts = await seedJobShells();
  console.info(`Draft shells: ${counts.created} created, ${counts.preserved} preserved.`);
} catch {
  console.error("Draft shell setup refused or failed. Check the allowed target and base departments.");
  process.exitCode = 1;
} finally { await closeDb(); }
