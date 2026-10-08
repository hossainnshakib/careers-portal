import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/app/admin/(protected)/applications/actions", () => ({ addNoteAction: vi.fn(), changeStatusAction: vi.fn(), deleteApplicationAction: vi.fn(), deleteNoteAction: vi.fn() }));
import { ViewerDate } from "./viewer-date";
import { ReviewControls } from "./review-controls";
import { ReviewFilterForm } from "./review-filters";
import { reviewFilters } from "@/lib/validation/review";

it("server-renders the shared Dhaka text while preserving the original UTC datetime", () => {
  const iso = "2026-10-09T01:42:53.000Z";
  const html = renderToStaticMarkup(createElement(ViewerDate, { iso }));
  expect(html).toContain("9 Oct 2026, 7:42 AM");
  expect(html).toContain(iso); expect(html).not.toContain(" UTC");
});
it("capitalizes both status dropdowns without changing their submitted enum values", () => {
  const control = renderToStaticMarkup(createElement(ReviewControls, { applicationId: "synthetic-id", status: "under_review" }));
  const filter = renderToStaticMarkup(createElement(ReviewFilterForm, { filters: reviewFilters.parse({}), options: { brands: [], departments: [], jobs: [] } }));
  for (const html of [control, filter]) {
    expect(html).toMatch(/<option[^>]*value="under_review"[^>]*>Under review<\/option>/);
    expect(html).toMatch(/<option[^>]*value="new"[^>]*>New<\/option>/);
    expect(html).toMatch(/<option[^>]*value="hired"[^>]*>Hired<\/option>/);
  }
});
