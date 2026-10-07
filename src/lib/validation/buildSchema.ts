import "./zod-csp";
import { z } from "zod";
import {
  isCalendarDate,
  questionDefinitionSchema,
  type QuestionDefinition,
} from "@/lib/questions/definition";

export type Answer = string | number | boolean | string[] | undefined;
const otherMaxLength = 500;

function answerSchema(question: QuestionDefinition): z.ZodType<Answer> {
  const config = question.config ?? {};
  const numeric = (key: string, fallback: number) =>
    typeof config[key] === "number" ? config[key] : fallback;
  const options = new Set(question.options?.map((option) => option.value));
  const permittedChoice = (value: string) =>
    options.has(value) ||
    (config.allowOther === true && value.length > 0 && value.length <= otherMaxLength);
  let schema: z.ZodType<Answer>;
  switch (question.type) {
    case "short_text":
    case "long_text":
      schema = z
        .string()
        .trim()
        .min(Math.max(1, numeric("minLength", 1)))
        .max(numeric("maxLength", question.type === "short_text" ? 300 : 10000));
      break;
    case "single_choice":
      schema = z
        .string()
        .trim()
        .min(1)
        .refine(permittedChoice, "Choose an available option or provide permitted Other text.");
      break;
    case "multiple_choice":
      schema = z
        .array(z.string().trim().min(1).refine(permittedChoice, "Invalid choice"))
        .min(Math.max(1, numeric("minSelected", 1)))
        .max(numeric("maxSelected", options.size + (config.allowOther === true ? 1 : 0)))
        .refine((values) => new Set(values).size === values.length, "Choices must be unique")
        .refine(
          (values) => values.filter((value) => !options.has(value)).length <= 1,
          "Provide only one Other answer",
        );
      break;
    case "yes_no":
      schema = z.boolean();
      break;
    case "number": {
      let number = z.number().min(numeric("min", -Infinity)).max(numeric("max", Infinity));
      if (config.integer === true) number = number.int();
      schema = number;
      break;
    }
    case "url":
      schema = z
        .string()
        .trim()
        .max(2048)
        .pipe(z.url({ protocol: /^https?$/ }));
      break;
    case "email":
      schema = z.string().trim().max(254).pipe(z.email());
      break;
    case "phone":
      schema = z
        .string()
        .trim()
        .max(40)
        .transform((value) => value.replace(/[\s()-]/g, ""))
        .refine(
          (value) =>
            /^01[3-9]\d{8}$/.test(value) ||
            /^\+8801[3-9]\d{8}$/.test(value) ||
            (!value.startsWith("+880") && /^\+[1-9]\d{7,14}$/.test(value)),
          "Enter a valid Bangladesh or international phone number.",
        );
      break;
    case "file_upload":
      // Opaque upload-token IDs only. Phase 2 must also verify ownership, object
      // existence and actual MIME/size against freshly loaded DB definitions.
      schema = z
        .array(z.uuid())
        .min(1)
        .max(8)
        .refine((values) => new Set(values).size === values.length, "Duplicate file tokens");
      break;
    case "date":
      schema = z
        .string()
        .refine(isCalendarDate, "Enter a valid ISO calendar date.")
        .refine((value) => {
          const today = new Date().toISOString().slice(0, 10);
          const min = config.min === "today" ? today : config.min;
          const max = config.max === "today" ? today : config.max;
          return (
            (typeof min !== "string" || value >= min) && (typeof max !== "string" || value <= max)
          );
        }, "Date is outside the permitted range.");
      break;
  }
  if (question.required) return schema;
  return z.preprocess(
    (value) =>
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
        ? undefined
        : value,
    schema.optional(),
  );
}

/** Shared client/server validator. Server callers must load definitions from DB. */
export function buildSchema(questions: readonly QuestionDefinition[]) {
  const shape: Record<string, z.ZodType<Answer>> = {};
  for (const input of questions) {
    const question = questionDefinitionSchema.parse(input);
    if (Object.hasOwn(shape, question.id)) throw new Error("Duplicate question ID");
    shape[question.id] = answerSchema(question);
  }
  return z.strictObject(shape);
}
