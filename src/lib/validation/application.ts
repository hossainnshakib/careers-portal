import "./zod-csp";
import { z } from "zod";
import { buildSchema } from "@/lib/validation/buildSchema";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { jobSlugSchema } from "./uploads";

const phoneQuestion: QuestionDefinition = { id: "00000000-0000-4000-8000-000000000001", label: "Phone", type: "phone", required: true, helpText: null, options: null, config: null, section: "professional", sortOrder: 0 };
export const contactSchema = z.strictObject({
  fullName: z.string().trim().min(1).max(200), email: z.string().trim().max(254).pipe(z.email()),
  phone: z.string().transform((value, ctx) => {
    const parsed = buildSchema([phoneQuestion]).safeParse({ [phoneQuestion.id]: value });
    if (!parsed.success) { ctx.addIssue({ code: "custom", message: "Enter a valid phone number." }); return z.NEVER; }
    return String(parsed.data[phoneQuestion.id]);
  }),
  location: z.string().trim().min(1).max(300),
});
export const applicationInputSchema = z.strictObject({
  jobSlug: jobSlugSchema, sessionToken: z.string().min(1).max(2048), turnstileToken: z.string().min(1).max(2048),
  honeypot: z.string().max(200).default(""),
  contact: contactSchema,
  cv: z.array(z.uuid()).max(1),
  answers: z.record(z.uuid(), z.unknown()),
});
/**
 * Total characters accepted across every answer of one submission.
 *
 * Per-question limits alone allow 100 questions x 10,000 characters to reach the
 * 2 MB action body limit, so storage, list queries and PDF rendering all inherit
 * an unbounded payload from a single anonymous submission.
 */
export const maxAnswerCharacters = 50_000;
function answerCharacters(value: unknown): number {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.reduce((total, item) => total + answerCharacters(item), 0);
  return 0;
}
export function validateApplicationAnswers(questions: QuestionDefinition[], answers: unknown, cv: string[], cvRequired: boolean) {
  const parsed = buildSchema(questions).parse(answers);
  const characters = Object.values(parsed).reduce<number>((total, value) => total + answerCharacters(value), 0);
  if (characters > maxAnswerCharacters)
    throw new Error(`Keep all of your written answers together under ${maxAnswerCharacters} characters.`);
  if (cvRequired && cv.length !== 1) throw new Error("CV required");
  const files = [...cv.map((id) => ({ id, slot: "cv" }))];
  for (const q of questions) {
    if (q.type === "file_upload" && Array.isArray(parsed[q.id])) {
      for (const id of parsed[q.id] as string[]) files.push({ id, slot: q.id });
    }
  }
  if (files.length > 8 || new Set(files.map((file) => file.id)).size !== files.length) throw new Error("Invalid file references");
  return { answers: parsed, files };
}
