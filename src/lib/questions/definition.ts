import { z } from "zod";
import { questionSectionEnum, questionTypeEnum } from "@/db/schema";

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const bound = z.union([z.literal("today"), z.string().refine(isCalendarDate, "Invalid date")]);
const nonnegative = z.number().int().nonnegative();
const textConfig = z.strictObject({
  minLength: nonnegative.optional(),
  maxLength: nonnegative.max(10000).optional(),
});
const configs = {
  short_text: textConfig,
  long_text: textConfig,
  single_choice: z.strictObject({
    display: z.enum(["radio", "dropdown"]).optional(),
    allowOther: z.boolean().optional(),
  }),
  multiple_choice: z.strictObject({
    allowOther: z.boolean().optional(),
    minSelected: nonnegative.optional(),
    maxSelected: nonnegative.optional(),
  }),
  yes_no: z.strictObject({}),
  number: z.strictObject({
    min: z.number().optional(),
    max: z.number().optional(),
    integer: z.boolean().optional(),
  }),
  url: z.strictObject({}),
  email: z.strictObject({}),
  phone: z.strictObject({}),
  file_upload: z.strictObject({
    accept: z
      .array(z.enum(["pdf", "png", "jpg", "webp", "zip"]))
      .min(1)
      .optional(),
    maxSizeMb: z.number().positive().max(10).optional(),
  }),
  date: z.strictObject({ min: bound.optional(), max: bound.optional() }),
};

export const questionDefinitionSchema = z
  .strictObject({
    id: z.uuid(),
    label: z.string().trim().min(1).max(300),
    helpText: z.string().trim().max(2000).nullable().default(null),
    type: z.enum(questionTypeEnum.enumValues),
    required: z.boolean(),
    options: z
      .array(
        z.strictObject({
          value: z.string().trim().min(1).max(200),
          label: z.string().trim().min(1).max(200),
        }),
      )
      .max(100)
      .nullable()
      .default(null),
    config: z.record(z.string(), z.unknown()).nullable().default(null),
    section: z.enum(questionSectionEnum.enumValues),
    sortOrder: nonnegative,
  })
  .superRefine((question, ctx) => {
    const parsed = configs[question.type].safeParse(question.config ?? {});
    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["config"],
        message: "Invalid config for question type",
      });
      return;
    }
    const config = parsed.data as Record<string, unknown>;
    for (const [low, high] of [
      ["min", "max"],
      ["minLength", "maxLength"],
      ["minSelected", "maxSelected"],
    ]) {
      const a = config[low];
      const b = config[high];
      if (
        ((typeof a === "number" && typeof b === "number") ||
          (typeof a === "string" && typeof b === "string" && a !== "today" && b !== "today")) &&
        a > b
      ) {
        ctx.addIssue({ code: "custom", path: ["config"], message: "Minimum exceeds maximum" });
      }
    }
    const choice = question.type === "single_choice" || question.type === "multiple_choice";
    if (
      choice &&
      (!question.options?.length ||
        new Set(question.options.map((option) => option.value)).size !== question.options.length)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Choice options must be nonempty and unique",
      });
    }
    if (!choice && question.options?.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Options only apply to choices" });
    }
  });

export type QuestionDefinition = z.infer<typeof questionDefinitionSchema>;
