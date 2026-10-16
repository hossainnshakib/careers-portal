import { execFileSync } from "node:child_process";

/** Reuse the CLI's independent approved-project guard, with NO write flags. */
export function verifyDemoTarget() {
  try {
    const stdout = execFileSync(process.execPath, ["--env-file-if-exists=.env.local", "--conditions=react-server", "--import", "tsx", "src/db/seed/validation.ts", "seed"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 });
    const report = JSON.parse(stdout.split(/\r?\n/)[0]);
    if (report.project !== "xmtoccukridshadnxrlc" || report.dryRun !== true || report.jobs !== 5)
      throw new Error("Mismatch");
  } catch {
    throw new Error("Approved DEV target and five DEMO records must be verified before browser fixtures may write.");
  }
}
