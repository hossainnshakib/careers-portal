import { z } from "zod";
import { employmentTypeEnum, experienceLevelEnum, workModeEnum } from "@/db/schema";
import { questionDefinitionSchema } from "@/lib/questions/definition";
import { slugInput } from "./departments";

export const jobInput = z
  .strictObject({
    id: z.uuid().nullable(),
    title: z.string().trim().min(1).max(200),
    slug: slugInput,
    departmentId: z.uuid(),
    brandIds: z.array(z.uuid()).min(1).max(50),
    primaryBrandId: z.uuid(),
    employmentType: z.enum(employmentTypeEnum.enumValues),
    workMode: z.enum(workModeEnum.enumValues),
    experienceLevel: z.enum(experienceLevelEnum.enumValues).nullable(),
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
    if (new Set(input.questions.map((q) => q.id)).size !== input.questions.length)
      ctx.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question IDs must be unique.",
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
