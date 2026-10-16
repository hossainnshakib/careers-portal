import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { reviewFilters } from "@/lib/validation/review";
import { ReviewFilterForm } from "./review-filters";

const options = { brands: [], departments: [], jobs: [] };

it("keeps all real filters with compact primary controls, disclosed extras and GET submission", () => {
  const html = renderToStaticMarkup(createElement(ReviewFilterForm, { filters: reviewFilters.parse({}), options }));
  for (const name of ["q", "brand", "department", "job", "status", "from", "to", "sort", "tz"]) expect(html).toContain(`name="${name}"`);
  expect(html).toContain('method="get"');
  expect(html).toContain('aria-label="More filters"');
  expect(html).toContain('id="review-extra-fields" class="admin-review-extra" hidden=""');
  expect(html).toContain('aria-label="Filter applications"');
  expect(html).toContain('aria-expanded="false" aria-controls="review-filter-fields review-extra-fields"');
});

it("places chips below the form and preserves inclusive date timezone when removing another filter", () => {
  const filters = reviewFilters.parse({ status: "new", from: "2026-10-01", to: "2026-10-12", tz: "Asia/Dhaka", sort: "oldest", q: "Synthetic" });
  const html = renderToStaticMarkup(createElement(ReviewFilterForm, { filters, options }));
  expect(html.indexOf("</form>")).toBeLessThan(html.indexOf("Status: New"));
  const match = html.match(/href="([^"]+)" class="admin-chip">Status: New/)!;
  const url = new URL(match[1].replaceAll("&amp;", "&"), "http://localhost");
  expect(url.searchParams.get("tz")).toBe("Asia/Dhaka");
  expect(url.searchParams.get("from")).toBe(filters.from);
  expect(url.searchParams.get("to")).toBe(filters.to);
  expect(url.searchParams.get("sort")).toBe("oldest");
  expect(url.searchParams.has("status")).toBe(false);
  expect(html).toContain("the end date is inclusive");
});
