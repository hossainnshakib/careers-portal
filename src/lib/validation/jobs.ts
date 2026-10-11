import "./zod-csp";
import { z } from "zod";
import { salaryModeEnum } from "@/db/schema";
import { questionDefinitionSchema } from "@/lib/questions/definition";
import { type OptionGroup } from "@/lib/careers/option-labels";
import { slugInput } from "./departments";

/** Publishing needs at least one arrangement and one engagement; experience is optional. */
export const requiredPublishGroups: OptionGroup[] = ["arrangement", "engagement"];

/** Pure rule shared by the editor's instant check and the server-side save. */
export function missingPublishGroups(selected: OptionGroup[]): OptionGroup[] {
  return requiredPublishGroups.filter((group) => !selected.includes(group));
}

const lineList = (maxItems: number, maxLength: number) =>
  z
    .array(z.string().trim().min(1).max(maxLength))
    .max(maxItems)
    .superRefine((items, ctx) => {
      if (items.some((item) => /[\r\n]/.test(item)))
        ctx.addIssue({ code: "custom", message: "Each item must fit on one line." });
    });

export const jobInput = z
  .strictObject({
    id: z.uuid().nullable(),
    title: z.string().trim().min(1).max(200),
    slug: slugInput,
    departmentId: z.uuid(),
    brandIds: z.array(z.uuid()).min(1).max(50),
    primaryBrandId: z.uuid(),
    optionIds: z.array(z.uuid()).max(30),
    engagementNote: z.string().trim().max(80).nullable(),
    salaryMode: z.enum(salaryModeEnum.enumValues),
    salaryText: z.string().trim().max(80),
    vacancies: z.number().int().min(1).max(10000).nullable(),
    experienceText: z.string().trim().max(60).nullable(),
    skills: lineList(20, 40),
    benefits: lineList(12, 60),
    niceToHaveMd: z.string().max(50000),
    locationText: z.string().trim().max(300),
    deadlineAt: z.iso.datetime({ offset: true }).nullable(),
    cvRequired: z.boolean(),
    summary: z.string().trim().max(200),
    descriptionMd: z.string().max(50000),
    responsibilitiesMd: z.string().max(50000),
    requirementsMd: z.string().max(50000),
    questions: z.array(questionDefinitionSchema).max(100),
    intent: z.enum(["save", "publish"]),
  })
  .superRefine((input, ctx) => {
    if (
      new Set(input.brandIds).size !== input.brandIds.length ||
      !input.brandIds.includes(input.primaryBrandId)
    )
      ctx.addIssue({
        code: "custom",
        path: ["brandIds"],
        message: "Select unique brands and one primary from that selection.",
      });
    if (new Set(input.optionIds).size !== input.optionIds.length)
      ctx.addIssue({
        code: "custom",
        path: ["optionIds"],
        message: "Each option can be selected only once.",
      });
    if (new Set(input.questions.map((q) => q.id)).size !== input.questions.length)
      ctx.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question IDs must be unique.",
      });
    if (input.salaryMode === "range" && !input.salaryText)
      ctx.addIssue({
        code: "custom",
        path: ["salaryText"],
        message: "Enter the salary range, for example ৳ 30,000 – 50,000 / month.",
      });
    if (input.salaryMode === "range" && /[\r\n]/.test(input.salaryText))
      ctx.addIssue({
        code: "custom",
        path: ["salaryText"],
        message: "Salary must be a single line.",
      });
  });
export const jobCommand = z.strictObject({
  id: z.uuid(),
  command: z.enum(["close", "reopen", "duplicate", "delete"]),
});
export const jobFilters = z.strictObject({
  status: z.enum(["", "draft", "open", "closed"]).default(""),
  department: z.union([z.literal(""), z.uuid()]).default(""),
  brand: z.union([z.literal(""), z.uuid()]).default(""),
  q: z.string().trim().max(200).default(""),
});
export type JobInput = z.infer<typeof jobInput>;
