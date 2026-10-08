import { z } from "zod";

export type AnswerDisplayInput = {
  typeSnapshot: string; value: unknown;
  optionsSnapshot?: unknown; questionOptions?: unknown;
};
const optionsSchema = z.array(z.object({ value: z.string(), label: z.string() }));

/** Prefer immutable options when supplied; current linked definitions are legacy fallback. */
export function displayAnswerValue(answer: AnswerDisplayInput): string | string[] {
  const source = answer.optionsSnapshot ?? answer.questionOptions;
  const parsed = optionsSchema.safeParse(source);
  const options = parsed.success ? parsed.data : [];
  const choice = answer.typeSnapshot === "single_choice" || answer.typeSnapshot === "multiple_choice";
  const display = (value: string | number) => choice && typeof value === "string"
    ? options.find(option => option.value === value)?.label ?? value : String(value);
  if (typeof answer.value === "boolean") return answer.value ? "Yes" : "No";
  if (typeof answer.value === "string" || typeof answer.value === "number") return display(answer.value);
  if (Array.isArray(answer.value)) return answer.value.map(value =>
    typeof value === "string" || typeof value === "number" ? display(value) : "Unsupported answer");
  return "No answer";
}
