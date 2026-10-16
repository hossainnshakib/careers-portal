import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/app/admin/(protected)/applications/actions", () => ({ addNoteAction: vi.fn(), changeStatusAction: vi.fn(), deleteApplicationAction: vi.fn(), deleteNoteAction: vi.fn() }));
import { DeleteApplicationControl, ReviewControls } from "./review-controls";
import { PdfDownload } from "./pdf-download";
import { ProfileReviewRail } from "./profile-review-rail";

it("keeps all statuses, explicit updates, private notes and validated note limit in the unboxed review rail", () => {
  const html = renderToStaticMarkup(createElement(ReviewControls, { applicationId: "fixture", status: "new" }));
  for (const status of ["new", "under_review", "shortlisted", "hired", "rejected"]) expect(html).toContain(`value="${status}"`);
  expect(html).toContain('aria-label="Application status"');
  expect(html).toContain('aria-label="Internal note"');
  expect(html).toContain('maxLength="10000"');
  expect(html).toContain("Update status");
  expect(html).toContain("Internal notes are never shared with candidates.");
  expect(html).toContain('role="status" aria-live="polite"');
  expect(html).not.toContain('class="admin-card"');
});

it("preserves gated PDF URL options with internal notes off by default and an initially open disclosure", () => {
  const html = renderToStaticMarkup(createElement(ProfileReviewRail, null, createElement(PdfDownload, { applicationId: "fixture" })));
  expect(html).toContain('class="admin-rail-details admin-card" open=""');
  expect(html).toContain("Status, notes &amp; downloads");
  expect(html).toContain('/api/admin/applications/fixture/pdf?notes=0&amp;tz=UTC&amp;locale=en-GB');
  expect(html).not.toContain("checked=");
});

it("names the irreversible confirmation with real escaped name/reference, cancel and existing confirm action label", () => {
  const html = renderToStaticMarkup(createElement(DeleteApplicationControl, { applicationId: "fixture", reference: "APP-234567", candidateName: "বাংলা <script>" }));
  expect(html).toContain("Delete this application?");
  expect(html).toContain("বাংলা &lt;script&gt;");
  expect(html).toContain("APP-234567");
  expect(html).toContain("answers, notes, history and uploaded files");
  expect(html).toContain("This cannot be undone.");
  expect(html).toContain("Cancel");
  expect(html).toContain('aria-label="Confirm deletion"');
  expect(html).toContain('aria-label="Confirm application deletion"');
});
