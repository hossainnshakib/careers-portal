import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ profile: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: async () => ({ userId: "synthetic-admin", email: "admin@example.test" }) }));
vi.mock("@/db/queries/review", () => ({ loadReviewProfile: mocks.profile }));
vi.mock("@/components/admin/pdf-download", () => ({ PdfDownload: () => null }));
vi.mock("@/components/admin/review-controls", () => ({ ReviewControls: () => null, DeleteApplicationControl: () => null, DeleteNoteButton: () => null }));
import ApplicantPage from "./page";
it("renders choice labels and yes/no text in the actual profile, keeping unknown Other text", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const common = { labelSnapshot: "Skills", sectionSnapshot: "skills", questionOptions: [{ value: "skill_0", label: "Beginner" }] };
  mocks.profile.mockResolvedValue({ application: { id, fullName: "Synthetic Candidate", status: "new", reference: "APP-234567", jobTitleSnapshot: "Synthetic role", departmentNameSnapshot: "Technical", brandNamesSnapshot: [], submittedAt: new Date("2026-10-09T01:42:00Z"), statusChangedAt: new Date("2026-10-09T01:42:00Z") },
    answers: [{ ...common, id: "a", typeSnapshot: "single_choice", value: "skill_0" }, { ...common, id: "b", typeSnapshot: "multiple_choice", value: ["skill_0", "Other text"] }, { ...common, id: "c", typeSnapshot: "yes_no", value: false }], files: [], notes: [], events: [], previous: [] });
  const html = renderToStaticMarkup(await ApplicantPage({ params: Promise.resolve({ id }) }));
  expect(html).toContain("Beginner"); expect(html).toContain("Other text"); expect(html.includes(">No</p>")).toBe(true);
  expect(html).not.toContain("skill_0");
});
