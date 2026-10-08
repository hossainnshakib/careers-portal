import "server-only";

import { closeDb } from "./index";
import { removeOrphanAdmins, sweepTestAccounts } from "./queries/test-accounts";

try {
  if (process.argv[2] === "orphans") {
    console.log(`Orphan admin_users rows removed: ${await removeOrphanAdmins()}`);
  } else {
    const counts = await sweepTestAccounts();
    console.log(`Test account sweep: ${counts.adminRowsRemoved} allowlist rows, ${counts.authUsersRemoved} Auth users removed.`);
  }
} catch {
  console.error("Guarded dev account cleanup failed. Check the pinned dev environment and connectivity.");
  process.exitCode = 1;
} finally {
  await closeDb();
}
