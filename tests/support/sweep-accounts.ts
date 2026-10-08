import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** Playwright invokes this before and after every serialized browser run. */
export default function sweepAccounts() {
  try {
    execFileSync(process.execPath, [
      "--env-file-if-exists=.env.local", "--conditions=react-server", "--import", "tsx",
      fileURLToPath(new URL("../../src/db/sweep-test-accounts.ts", import.meta.url)),
    ], { stdio: "inherit", timeout: 120_000 });
  } catch {
    throw new Error("Dev browser account sweep failed; resolve cleanup before running browser tests.");
  }
}
