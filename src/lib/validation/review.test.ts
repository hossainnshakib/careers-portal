import { expect, it } from "vitest";
import { deleteApplicationInput, noteInput, reviewFilters, safeApplicantUrl } from "./review";
it("validates UUID filters, Gregorian date bounds, timezone, status, sorting and bounded pagination", () => {
  expect(reviewFilters.parse({ q: "  শ্রী  ", from: "2026-10-01", to: "2026-10-06", tz: "Asia/Dhaka", page: "2" })).toMatchObject({ q: "শ্রী", page: 2 });
  for (const invalid of [{ brand: "invalid" }, { status: "invalid" }, { page: "0" }, { page: "Infinity" }, { from: "2026-02-30" }, { from: "2026-10-07", to: "2026-10-06" }, { tz: "evil-zone" }, { sort: "injected-sql" }, { q: "x".repeat(201) }]) expect(reviewFilters.safeParse(invalid).success).toBe(false);
});
it("limits notes and requires explicit deletion confirmation", () => {
  const applicationId = "00000000-0000-4000-8000-000000000001";
  expect(noteInput.safeParse({ applicationId, note: "   " }).success).toBe(false);
  expect(noteInput.safeParse({ applicationId, note: "x".repeat(10001) }).success).toBe(false);
  expect(deleteApplicationInput.safeParse({ applicationId }).success).toBe(false);
});
it("allows only HTTP(S) applicant links, leaving unsafe values as inert text", () => {
  expect(safeApplicantUrl("https://example.com/portfolio")).toBe("https://example.com/portfolio");
  for (const value of ["javascript:alert(1)", "data:text/html,script", "//attacker.test", "mailto:person@example.com", { href: "https://example.com" }]) expect(safeApplicantUrl(value)).toBeNull();
});
