import { createHash } from "node:crypto";
import { demoDisclaimer, demoMarker, demoSlugs } from "@/lib/demo";
import { standardQuestions } from "@/lib/questions/defaults";
import { questionDefinitionSchema, type QuestionDefinition } from "@/lib/questions/definition";
import { jobInput, type JobInput } from "@/lib/validation/jobs";

/** Stable IDs keep existing answer references intact on an idempotent rerun. */
export function demoQuestionId(slug: string, label: string) {
  const hex = createHash("sha256").update(`prompt13:${slug}:${label}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

type Extra = Pick<QuestionDefinition, "label" | "type" | "section" | "required"> & Partial<QuestionDefinition>;
const choices = [{ label: "Accessibility", value: "accessibility" }, { label: "Testing", value: "testing" }, { label: "Documentation", value: "documentation" }];
const roles = [
  { role: "Platform Developer", department: "web-technical", brands: ["fixen-media", "accoraze"], options: ["remote", "full_time", "mid"], range: "Sample BDT 45,000–65,000 / month", experience: "Sample: 2–4 years", skills: ["TypeScript", "PostgreSQL", "Accessibility"], work: "build accessible sample application screens", output: "a documented prototype", questions: [
    { label: "Sample technical focus", type: "single_choice", section: "skills", required: true, options: choices, config: { display: "radio", allowOther: true } },
    { label: "Sample collaboration preference", type: "single_choice", section: "role_specific", required: false, options: choices, config: { display: "dropdown", allowOther: true } },
    { label: "Sample tools used", type: "multiple_choice", section: "skills", required: true, options: choices, config: { minSelected: 1, maxSelected: 2, allowOther: true } },
    { label: "Can you review a synthetic prototype?", type: "yes_no", section: "role_specific", required: true },
    { label: "Synthetic alternative email", type: "email", section: "professional", required: false },
    { label: "Synthetic alternative phone", type: "phone", section: "professional", required: false },
    { label: "Synthetic work sample", type: "file_upload", section: "portfolio", required: true, config: { accept: ["pdf", "png"], maxSizeMb: 2 } },
    { label: "Sample weekly availability", type: "number", section: "experience", required: false, config: { min: 0.5, max: 40, integer: false } },
  ] },
  { role: "Visual Designer", department: "design-creative", brands: ["doshok", "avagata"], options: ["hybrid", "freelance", "entry"], range: "", experience: "Sample: 0–2 years", skills: ["Figma", "Typography", "Colour contrast"], work: "create a fictional product identity kit", output: "three annotated design concepts", questions: [
    { label: "Describe your sample visual concept", type: "short_text", section: "skills", required: true, config: { minLength: 5, maxLength: 120 } },
    { label: "Synthetic image sample", type: "file_upload", section: "portfolio", required: false, config: { accept: ["jpg", "webp"], maxSizeMb: 3 } },
    { label: "Sample design feedback", type: "long_text", section: "role_specific", required: false, config: { minLength: 10, maxLength: 800 } },
  ] },
  { role: "Video Producer", department: "video-motion-production", brands: ["builtale", "ghora-fera"], options: ["onsite", "project-based", "contract", "senior"], range: "Sample BDT 70,000–90,000 / project", experience: "Sample: 5+ years", skills: ["Storyboarding", "Editing", "Captioning"], work: "edit a fictional travel-and-space explainer", output: "a captioned thirty-second sample film", questions: [
    { label: "Synthetic project archive", type: "file_upload", section: "portfolio", required: false, config: { accept: ["zip"], maxSizeMb: 5 } },
    { label: "Sample production date", type: "date", section: "role_specific", required: true, config: { min: "today", max: "2099-12-31" } },
  ] },
  { role: "Bengali Editor", department: "content-copywriting", brands: ["wiki-bangla"], options: ["remote", "part_time", "entry"], range: "", experience: "Sample: 1–3 years", skills: ["বাংলা সম্পাদনা", "Research", "Plain language"], work: "revise a fictional bilingual learning article", output: "a fact-check checklist and edited sample", questions: [
    { label: "নমুনা সম্পাদনা সম্পর্কে লিখুন", type: "long_text", section: "skills", required: true, config: { minLength: 10, maxLength: 1000 } },
    { label: "Sample past publication date", type: "date", section: "experience", required: false, config: { min: "2000-01-01", max: "today" } },
  ] },
  { role: "Campaign Coordinator", department: "marketing-social", brands: ["mactie", "fixen-media"], options: ["hybrid", "internship", "fresher-welcome"], range: "Sample BDT 12,000–18,000 / month", experience: "Sample: no prior employment required", skills: ["Spreadsheets", "Planning", "Communication"], work: "plan a fictional awareness campaign", output: "a sample channel calendar and metrics sheet", questions: [
    { label: "Sample campaign priorities", type: "multiple_choice", section: "skills", required: false, options: choices, config: { minSelected: 0, maxSelected: 3, allowOther: false } },
    { label: "Sample planning preference", type: "single_choice", section: "role_specific", required: true, options: choices, config: { display: "dropdown", allowOther: false } },
  ] },
] satisfies Array<{ role: string; department: string; brands: string[]; options: string[]; range: string; experience: string; skills: string[]; work: string; output: string; questions: Extra[] }>;

export type DemoCatalog = { brands: { id: string; slug: string }[]; departments: { id: string; slug: string }[]; options: { id: string; slug: string }[] };
function lookup(rows: { id: string; slug: string }[], slug: string) {
  const row = rows.find(row => row.slug === slug);
  if (!row) throw new Error("Required base catalog record missing; no structural data will be changed.");
  return row.id;
}
export function validationJobs(catalog: DemoCatalog): JobInput[] {
  return roles.map((role, index) => {
    const slug = demoSlugs[index];
    const questions = [...standardQuestions, ...role.questions].map((question, order) => questionDefinitionSchema.parse({
      ...question, id: demoQuestionId(slug, question.label), sortOrder: order,
      helpText: "Synthetic answers/files only. No real personal information.",
    }));
    return jobInput.parse({
      id: null, slug, title: `DEMO — ${role.role} — ${demoDisclaimer}`,
      departmentId: lookup(catalog.departments, role.department),
      brandIds: role.brands.map(slug => lookup(catalog.brands, slug)), primaryBrandId: lookup(catalog.brands, role.brands[0]),
      optionIds: role.options.map(slug => lookup(catalog.options, slug)),
      engagementNote: "Fictional validation arrangement only", salaryMode: role.range ? "range" : "negotiable", salaryText: role.range,
      vacancies: index + 1, experienceText: role.experience, skills: role.skills,
      benefits: ["Sample learning allowance — not an offer", "Sample flexible hours — not an offer", "Sample equipment budget — not an offer"],
      niceToHaveMd: "- Sample: accessible communication\n- Sample: documented project decisions",
      locationText: index === 3 ? "নমুনা: ঢাকা / Remote, Bangladesh" : "Sample: Dhaka, Bangladesh",
      deadlineAt: "2099-12-31T17:59:00.000Z", cvRequired: index !== 3,
      summary: `${demoDisclaimer}. Sample task: ${role.work}.`,
      descriptionMd: `${demoDisclaimer}\n\n${demoMarker}\n\nThis fictional role validates the careers portal. No brand is offering employment, pay or benefits through this listing.\n\nThe sample assignment is to ${role.work}. The output is ${role.output}. Use synthetic identities and dummy files only.`,
      responsibilitiesMd: `- Sample: ${role.work}\n- Sample: prepare ${role.output}\n- Sample: document assumptions and decisions\n- Sample: review accessibility and clarity\n- Sample: share a concise handoff`,
      requirementsMd: `- Sample familiarity with ${role.skills.join(", ")}\n- Ability to explain a synthetic project\n- Attention to accessible communication\n- Use of fictional data only\n- No real client or applicant material`,
      questions, intent: "save",
    });
  });
}

/** Exact namespace AND content marker; a prefix alone never authorizes a write. */
export function ownsValidationJob(job: { slug: string; title: string; descriptionMd: string }) {
  return (demoSlugs as readonly string[]).includes(job.slug) && job.title.startsWith("DEMO — ") &&
    job.title.includes(demoDisclaimer) && job.descriptionMd.includes(demoMarker) && job.descriptionMd.startsWith(demoDisclaimer);
}
