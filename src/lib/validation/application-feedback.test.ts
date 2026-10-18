import { expect, it } from "vitest";
import { applicationInputSchema, validateApplicationAnswers } from "./application";
import { applicationFieldErrors } from "./application-feedback";
import type { QuestionDefinition } from "@/lib/questions/definition";

const id = "10000000-0000-4000-8000-000000000001";
const file = "20000000-0000-4000-8000-000000000001";
const question = (type: QuestionDefinition["type"], required = true): QuestionDefinition => ({ id, label: "Synthetic question", type, required, section: "professional", sortOrder: 0, config: null, options: null, helpText: null });

it("maps known contact/consent/CV errors without copying submitted values or internal issues", () => {
  const parsed = applicationInputSchema.safeParse({ contact: { email: "sensitive-marker", phone: "invalid" }, consent: false, cv: ["invalid"], sessionToken: "", turnstileToken: "" });
  expect(parsed.success).toBe(false);
  if (parsed.success) return;
  const errors = applicationFieldErrors(parsed.error.issues, [], true);
  expect(errors.map(error => error.field)).toEqual(expect.arrayContaining(["contact.fullName", "contact.email", "contact.phone", "contact.location", "consent", "cv"]));
  expect(JSON.stringify(errors)).not.toMatch(/sensitive-marker|sessionToken|turnstileToken|honeypot|invalid_type/);
});

it("never exposes security, unknown question keys, or unrecognized-key issue contents", () => {
  expect(applicationFieldErrors([{ path: ["honeypot"] }, { path: ["turnstileToken"] }, { path: ["sessionToken"] }, { path: ["answers", "unknown"] }, { path: [] }], [question("number")], true)).toEqual([]);
});

it.each(["number", "date", "url", "email", "phone", "single_choice", "multiple_choice", "yes_no", "file_upload", "short_text", "long_text"] as const)("provides one safe field error for %s", type => {
  const q = question(type);
  const errors = applicationFieldErrors([{ path: [id] }, { path: [id, 0] }], [q]);
  expect(errors).toHaveLength(1);
  expect(errors[0].field).toBe(`answers.${id}`);
  expect(errors[0].message.length).toBeGreaterThan(10);
});

it("accepts optional blanks and keeps false, zero, numeric/date types and opaque file references", () => {
  const types = ["url", "email", "phone", "date", "number", "yes_no", "file_upload"] as const;
  const questions = types.map((type, index) => ({ ...question(type, false), id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}` }));
  const blank = Object.fromEntries(questions.map(q => [q.id, ""]));
  expect(() => validateApplicationAnswers(questions, blank, [file], true)).not.toThrow();
  const answers = { ...blank, [questions[3].id]: "2099-12-31", [questions[4].id]: 0, [questions[5].id]: false, [questions[6].id]: [id] };
  const validated = validateApplicationAnswers(questions, answers, [file], true);
  expect(validated.answers[questions[4].id]).toBe(0);
  expect(validated.answers[questions[5].id]).toBe(false);
  expect(validated.files).toEqual([{ id: file, slot: "cv" }, { id, slot: questions[6].id }]);
});

it("keeps malformed numeric/date/file answers invalid and gives missing CV a field path", () => {
  for (const [type, value] of [["number", "3"], ["date", "2026-02-30"], ["file_upload", ["pending/path.pdf"]]] as const) {
    expect(() => validateApplicationAnswers([question(type)], { [id]: value }, [file], true)).toThrow();
  }
  try { validateApplicationAnswers([], {}, [], true); throw new Error("Expected rejection"); }
  catch (error) { expect(error).toMatchObject({ issues: [{ path: ["cv"] }] }); }
});
