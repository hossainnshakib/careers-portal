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

it("restores the repeated name, initials, nested previous cards and genuine empty messages", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const application = { id, fullName: "শ্রী ক্ষিতিশ", email: "synthetic@example.test", phone: "01700000000", location: "Dhaka", status: "new", reference: "APP-234567", jobTitleSnapshot: "Synthetic role", departmentNameSnapshot: "Technical", brandNamesSnapshot: ["Fixture brand"], submittedAt: new Date("2026-10-09T01:42:00Z"), statusChangedAt: new Date("2026-10-09T01:42:00Z") };
  const base = { application, answers: [], files: [], notes: [], events: [], previous: [], brandAccents: [{ name: "Fixture brand", accentColor: "#123456", logoUrl: "/fixture.svg" }] };
  mocks.profile.mockResolvedValue(base);
  const html = renderToStaticMarkup(await ApplicantPage({ params: Promise.resolve({ id }) }));
  expect(html).toContain('<h1>শ্রী ক্ষিতিশ</h1>');
  expect(html).toContain('class="admin-profile-name"><span>শ্রী ক্ষিতিশ</span>');
  expect([...html.matchAll(/<h1/g)]).toHaveLength(1);
  expect(html).not.toContain("/fixture.svg");
  for (const text of ["No additional answers.", "No other applications from this email.", "No status history.", "No notes yet.", "No attachments."]) expect(html).toContain(text);
  expect(html).not.toContain("Consent given on");
  expect(html).toContain('class="admin-rail-details admin-card" open=""');
  mocks.profile.mockResolvedValue({ ...base, previous: [{ id: "previous", reference: "APP-ABCDEF", jobTitle: "Earlier role", submittedAt: application.submittedAt, status: "rejected" }] });
  const previousHtml = renderToStaticMarkup(await ApplicantPage({ params: Promise.resolve({ id }) }));
  expect(previousHtml).toContain('href="/admin/applications/previous"');
  expect(previousHtml).toContain("Earlier role");
  expect(previousHtml).toContain("Rejected");
  expect(previousHtml).toContain("admin-card-nested");
});

it("renders ordered sections, consent, Bengali and long safe text without raw HTML or unsafe URL links", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const date = new Date("2026-10-09T01:42:00Z");
  const sections = ["professional", "experience", "skills", "portfolio", "role_specific"];
  mocks.profile.mockResolvedValue({ application: { id, fullName: "Synthetic Candidate", status: "new", reference: "APP-234567", jobTitleSnapshot: "Synthetic role", brandNamesSnapshot: [], submittedAt: date, consentAt: date, statusChangedAt: date },
    answers: sections.map((section, i) => ({ id: String(i), labelSnapshot: `Question ${i}`, sectionSnapshot: section, typeSnapshot: i === 3 ? "url" : "long_text", value: i === 3 ? "javascript:alert(1)" : "বাংলা <script>alert(1)</script>" })), files: [], notes: [], events: [], previous: [] });
  const html = renderToStaticMarkup(await ApplicantPage({ params: Promise.resolve({ id }) }));
  expect(html).toContain("Consent given on");
  expect(html).toContain("বাংলা &lt;script&gt;");
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain("<script>");
  const headings = ["professional", "experience", "skills", "portfolio", "Role-specific answers"].map((text) => html.indexOf(`>${text}</h2>`));
  expect(headings.every((value) => value >= 0)).toBe(true);
  expect(headings).toEqual([...headings].sort((a, b) => a - b));
});
