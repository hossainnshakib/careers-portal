import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { ownsFixtureCandidate } from "./test-fixtures";

const prefix = `e2e-${"a".repeat(32)}-`;
it("recognizes only explicit synthetic fixture identities with a valid nonce namespace", () => {
  for (const row of [
    { email: `${prefix}candidate@example.com`, fullName: "Synthetic" },
    { email: `${prefix.toUpperCase()}candidate@EXAMPLE.COM`, fullName: "Synthetic" },
    { email: "fixture@example.com", fullName: "Test Candidate" },
    { email: "public-fixture@example.com", fullName: "শ্রী ক্ষিতিশ" },
  ]) expect(ownsFixtureCandidate(prefix, row)).toBe(true);
});
it("refuses unexpected applicants even when they apply to a transient test job", () => {
  for (const email of ["unrelated@example.com", `${prefix}candidate@other.example`, "fixture@example.com.attacker.example"])
    expect(ownsFixtureCandidate(prefix, { email, fullName: "Unrelated synthetic identity" })).toBe(false);
  expect(ownsFixtureCandidate("", { email: "fixture@example.com", fullName: "Test Candidate" })).toBe(false);
  expect(ownsFixtureCandidate(prefix, { email: "fixture@example.com", fullName: "Not the known fixture" })).toBe(false);
});
