import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ UPLOAD_SESSION_SECRET: "test-secret-with-at-least-32-characters" }) }));
import { createUploadSession, verifyUploadSession } from "./upload-session";
afterEach(() => vi.useRealTimers());
it("authenticates sessions, binds them to a job and rejects tampering", () => {
  const { token, session } = createUploadSession("web-developer");
  expect(verifyUploadSession(token, "web-developer")).toEqual(session);
  expect(() => verifyUploadSession(token, "other-job")).toThrow();
  const [payload, signature] = token.split(".");
  const changedSignature = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  expect(() => verifyUploadSession(`${payload}.${changedSignature}`, "web-developer")).toThrow();
  expect(() => verifyUploadSession(`${token}.extra`, "web-developer")).toThrow();
  expect(() => verifyUploadSession("x".repeat(2049), "web-developer")).toThrow();
});
it("expires at exactly two hours and rejects sessions issued in the future", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-06T12:00:00Z"));
  const { token } = createUploadSession("web-developer");
  vi.setSystemTime(new Date("2026-10-06T14:00:00Z"));
  expect(() => verifyUploadSession(token, "web-developer")).toThrow();
  vi.setSystemTime(new Date("2026-10-06T11:59:59Z"));
  expect(() => verifyUploadSession(token, "web-developer")).toThrow();
});
