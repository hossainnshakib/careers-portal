import { fork, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test as base, expect } from "@playwright/test";

type Account = { email: string; password: string; prefix: string };
function waitFor(child: ChildProcess, type: string) {
  return new Promise<Record<string, string>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Test fixture timed out."));
    }, 60000);
    function cleanup() {
      clearTimeout(timeout);
      child.off("message", message);
      child.off("exit", exit);
    }
    function exit() {
      cleanup();
      reject(new Error("Test fixture exited unexpectedly."));
    }
    function message(value: unknown) {
      if (!value || typeof value !== "object" || !("type" in value)) return;
      const data = value as Record<string, string>;
      if (data.type === type) {
        cleanup();
        resolve(data);
      } else if (data.type === "error") {
        cleanup();
        reject(new Error(data.message));
      }
    }
    child.on("message", message);
    child.on("exit", exit);
  });
}

export const test = base.extend<{ adminAccount: Account }>({
  adminAccount: [
    async ({}, use) => {
      const child = fork(fileURLToPath(new URL("./admin-worker.ts", import.meta.url)), [], {
        execArgv: [
          "--env-file-if-exists=.env.local",
          "--conditions=react-server",
          "--import",
          "tsx",
        ],
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      });
      try {
        const account = await waitFor(child, "ready");
        await use({ email: account.email, password: account.password, prefix: account.prefix });
      } finally {
        if (child.connected) {
          const cleaned = waitFor(child, "cleaned");
          child.send("cleanup");
          await cleaned;
        }
      }
    },
    { timeout: 120000 },
  ],
});
export { expect };
