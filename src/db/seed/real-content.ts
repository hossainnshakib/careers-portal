import { randomUUID } from "node:crypto";
import { z } from "zod";
import rawRealJobs from "./real-jobs.json";
import { copyStandardQuestions } from "@/lib/questions/defaults";
import type { QuestionDefinition } from "@/lib/questions/definition";
import { jobInput, type JobInput } from "@/lib/validation/jobs";

/**
 * Owner-provided real job content for the 19 final jobs (`pnpm jobs:import-real`).
 *
 * `real-jobs.json` is the raw package received from the content author. The file
 * is parsed and validated here on load, then mapped through the same `jobInput`
 * schema the admin panel uses, so an invalid package fails before any write.
 *
 * Mapping rules (deliberately conservative):
 * - Only fields present in the JSON change. Benefits, vacancies, experience
 *   text, deadlines and salary ranges are cleared (the package carries none).
 * - `locationText` is preserved from the existing job row.
 * - Job status/publish state is preserved (`intent: "save"`); the import never
 *   publishes, closes or re-slugs a job.
 * - Questions are matched to existing non-archived questions by label+type and
 *   keep their IDs, so re-running the import is idempotent and existing
 *   application answers keep pointing at the same rows. Removed demo questions
 *   are archived by `saveJob` (never deleted) when applications exist.
 */

const rawQuestionSchema = z.strictObject({
  label: z.string().min(1),
  type: z.string(),
  required: z.boolean(),
  section: z.string(),
  help_text: z.string().optional(),
  options: z
    .array(z.strictObject({ value: z.string().min(1), label: z.string().min(1) }))
    .optional(),
  config: z.unknown().optional(),
});

const rawJobSchema = z.strictObject({
  slug: z.string().min(1),
  title: z.string().min(1),
  department_slug: z.string().min(1),
  brands: z.array(z.string().min(1)).min(1),
  options: z.strictObject({
    arrangement: z.array(z.string().min(1)),
    engagement: z.array(z.string().min(1)),
    experience: z.array(z.string().min(1)),
  }),
  salary_mode: z.literal("negotiable"),
  summary: z.string(),
  description_md: z.string(),
  responsibilities_md: z.string(),
  requirements_md: z.string(),
  nice_to_have_md: z.string(),
  skills: z.array(z.string().min(1)),
  cv_required: z.boolean(),
  use_standard_questions: z.boolean(),
  questions: z.array(rawQuestionSchema),
});

const realJobsFileSchema = z.strictObject({
  version: z.literal(1),
  jobs: z.array(rawJobSchema).min(1),
});

export type RealJob = z.infer<typeof rawJobSchema>;
export type RawRealQuestion = z.infer<typeof rawQuestionSchema>;

export const realJobs: RealJob[] = realJobsFileSchema.parse(rawRealJobs).jobs;

export type ExistingQuestion = {
  id: string;
  label: string;
  type: string;
  archivedAt: Date | null;
};

export type RealJobContext = {
  /** ID of the existing dev job row this content is applied to. */
  jobId: string;
  departmentId: string;
  /** Resolved brand IDs in the JSON's order; the first one becomes primary. */
  brandIds: string[];
  /** Resolved option IDs for every arrangement/engagement/experience slug. */
  optionIds: string[];
  /** Preserved location line; falls back to "Dhaka, Bangladesh" when null. */
  locationText: string | null;
  /** Current (non-archived) questions of the job, for stable ID reuse. */
  existingQuestions: ExistingQuestion[];
};

function toDefinition(
  question: RawRealQuestion,
): Omit<QuestionDefinition, "id" | "sortOrder"> {
  return {
    label: question.label,
    helpText: question.help_text ?? null,
    type: question.type as QuestionDefinition["type"],
    required: question.required,
    options: question.options ?? null,
    config: (question.config ?? null) as QuestionDefinition["config"],
    section: question.section as QuestionDefinition["section"],
  };
}

/**
 * Map one raw job onto a fully validated `JobInput` ready for `saveJob`.
 * Throws (via `jobInput.parse`) if the package violates any admin rule.
 */
export function realJobToInput(raw: RealJob, ctx: RealJobContext): JobInput {
  const definitions: Array<Omit<QuestionDefinition, "id" | "sortOrder">> = [
    ...(raw.use_standard_questions ? copyStandardQuestions() : []),
    ...raw.questions.map(toDefinition),
  ];
  // Reuse existing question IDs by label+type so re-runs do not churn IDs.
  const reusable = new Map<string, string>();
  for (const question of ctx.existingQuestions) {
    if (question.archivedAt) continue;
    reusable.set(`${question.label}\u0000${question.type}`, question.id);
  }
  const used = new Set<string>();
  const questions = definitions.map((definition, index) => {
    const key = `${definition.label}\u0000${definition.type}`;
    const existingId = reusable.get(key);
    const id = existingId && !used.has(existingId) ? existingId : randomUUID();
    used.add(id);
    return { ...definition, id, sortOrder: index };
  });

  return jobInput.parse({
    id: ctx.jobId,
    title: raw.title,
    slug: raw.slug,
    departmentId: ctx.departmentId,
    brandIds: ctx.brandIds,
    primaryBrandId: ctx.brandIds[0],
    optionIds: ctx.optionIds,
    engagementNote: null,
    salaryMode: raw.salary_mode,
    salaryText: "",
    vacancies: null,
    experienceText: null,
    skills: raw.skills,
    benefits: [],
    niceToHaveMd: raw.nice_to_have_md,
    locationText: ctx.locationText ?? "Dhaka, Bangladesh",
    deadlineAt: null,
    cvRequired: raw.cv_required,
    summary: raw.summary,
    descriptionMd: raw.description_md,
    responsibilitiesMd: raw.responsibilities_md,
    requirementsMd: raw.requirements_md,
    questions,
    intent: "save",
  });
}
