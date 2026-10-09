import { fork, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test as base, expect } from "@playwright/test";

type Account = { email: string; password: string; prefix: string; cookieJSON: string; otp: () => Promise<string>;
  refreshCookies: (cookies: string) => Promise<string>; expireSession: (cookies: string) => Promise<void>;
  changePassword: () => Promise<string>; removeFactor: () => Promise<void> };
type PublicFixture = Account & {
  job: { slug: string; id: string; questionId: string; textId: string; brandSlug: string; departmentSlug: string; title: string };
  trackSession: (id: string) => void;
  verify: (reference: string) => Promise<Record<string, number | boolean>>;
  review: { applicationId: string; previousId: string; attachmentId: string; reference: string; jobId: string; title: string; email: string; brandId: string; departmentId: string };
  verifyReview: (id: string) => Promise<Record<string, number | boolean | string | null>>;
};
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

async function withAccount(consume: (account: PublicFixture) => Promise<void>, outsider: boolean | "public" | "review" | "mfa" = false) {
  const child = fork(
    fileURLToPath(new URL("./admin-worker.ts", import.meta.url)),
    typeof outsider === "string" ? [outsider] : outsider ? ["outsider"] : [],
    {
      execArgv: ["--env-file-if-exists=.env.local", "--conditions=react-server", "--import", "tsx"],
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    },
  );
  try {
    const account = await waitFor(child, "ready");
    await consume({
      email: account.email,
      password: account.password,
      prefix: account.prefix,
      cookieJSON: account.cookieJSON,
      otp: async () => { const code = waitFor(child, "otp"); child.send("otp"); return (await code).code; },
      refreshCookies: async cookies => { const result = waitFor(child, "session-refreshed"); child.send({ type: "refresh-session", cookies }); return (await result).cookies; },
      expireSession: async cookies => { const result = waitFor(child, "session-expired"); child.send({ type: "expire-session", cookies }); await result; },
      changePassword: async () => { const result = waitFor(child, "password-changed"); child.send({ type: "change-password" }); return (await result).password; },
      removeFactor: async () => { const result = waitFor(child, "factor-removed"); child.send({ type: "remove-factor" }); await result; },
      job: JSON.parse(account.publicJobJSON ?? "null"),
      review: JSON.parse(account.reviewJSON ?? "null"),
      trackSession: (id) => child.send({ type: "session", id }),
      verify: async (reference) => {
        const verified = waitFor(child, "verified"); child.send({ type: "verify", reference });
        return JSON.parse((await verified).counts);
      },
      verifyReview: async (id) => {
        const verified = waitFor(child, "review-verified"); child.send({ type: "review-verify", id });
        return JSON.parse((await verified).counts);
      },
    });
  } finally {
    if (child.connected) {
      const cleaned = waitFor(child, "cleaned");
      child.send("cleanup");
      await cleaned;
    }
  }
}
export const test = base.extend<{ adminAccount: Account; outsiderAccount: Account; publicFixture: PublicFixture; reviewFixture: PublicFixture; mfaAccount: Account }>({
  adminAccount: [
    async ({}, use) => {
      await withAccount(use);
    },
    { timeout: 120000 },
  ],
  outsiderAccount: [
    async ({}, use) => {
      await withAccount(use, true);
    },
    { timeout: 120000 },
  ],
  publicFixture: [async ({}, use) => { await withAccount(use, "public"); }, { timeout: 120000 }],
  reviewFixture: [async ({}, use) => { await withAccount(use, "review"); }, { timeout: 120000 }],
  mfaAccount: [async ({}, use) => { await withAccount(use, "mfa"); }, { timeout: 120000 }],
});
export { expect };
