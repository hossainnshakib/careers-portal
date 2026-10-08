import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ CRON_SECRET: "synthetic-cron-secret-at-least-32-characters" }) }));
import { hasCronAuthorization } from "./cron";

it("accepts only the exact bearer header", () => {
  expect(hasCronAuthorization("Bearer synthetic-cron-secret-at-least-32-characters")).toBe(true);
});
it.each([null, "", "Bearer wrong", "Basic synthetic-cron-secret-at-least-32-characters", "Bearer synthetic-cron-secret-at-least-32-characterX", "Bearer synthetic-cron-secret-at-least-32-characters ", "x".repeat(2049)])("rejects a missing or mismatched authorization header", (header) => {
  expect(hasCronAuthorization(header)).toBe(false);
});
