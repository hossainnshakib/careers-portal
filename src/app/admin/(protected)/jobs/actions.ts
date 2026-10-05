"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, AdminAccessError } from "@/lib/auth/requireAdmin";
import { loadJob, mutateJob, saveJob } from "@/db/queries/jobs";
import { jobCommand, jobInput } from "@/lib/validation/jobs";
import { questionDefinitionSchema, type QuestionDefinition } from "@/lib/questions/definition";
import type { ActionResult } from "@/lib/actions/result";

type Saved = { id: string; slug: string; previousSlug: string };
function invalidate(saved: Saved) {
  revalidateTag("jobs");
  revalidateTag("brands");
  revalidateTag("departments");
  for (const slug of new Set([saved.slug, saved.previousSlug])) revalidateTag(`job:${slug}`);
  revalidatePath("/admin/jobs");
}
function failure(error: unknown) {
  return {
    ok: false,
    error:
      error instanceof AdminAccessError
        ? "Administrator access required."
        : "Unable to update job. Check its fields, unique slug and current status, then try again.",
  } as const;
}

export async function saveJobAction(input: unknown): Promise<ActionResult<Saved>> {
  try {
    await requireAdmin();
    const parsed = jobInput.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: "Check job fields, primary brand and question settings." };
    const saved = await saveJob(parsed.data);
    invalidate(saved);
    return { ok: true, data: saved };
  } catch (error) {
    return failure(error);
  }
}
export async function jobCommandAction(input: unknown): Promise<ActionResult<Saved>> {
  try {
    await requireAdmin();
    const parsed = jobCommand.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid job command." };
    const saved = await mutateJob(parsed.data.id, parsed.data.command);
    invalidate(saved);
    return { ok: true, data: saved };
  } catch (error) {
    return failure(error);
  }
}
export async function copyJobQuestionsAction(
  input: unknown,
): Promise<ActionResult<QuestionDefinition[]>> {
  try {
    await requireAdmin();
    const parsed = z.strictObject({ sourceJobId: z.uuid() }).safeParse(input);
    if (!parsed.success) return { ok: false, error: "Choose a source job." };
    const source = await loadJob(parsed.data.sourceJobId);
    if (!source) return { ok: false, error: "Source job not found." };
    const copied = source.questions
      .filter((q) => !q.archivedAt)
      .map((q, sortOrder) =>
        questionDefinitionSchema.parse({
          id: randomUUID(),
          label: q.label,
          type: q.type,
          required: q.required,
          section: q.section,
          helpText: q.helpText,
          options: q.options,
          config: q.config,
          sortOrder,
        }),
      );
    return { ok: true, data: copied };
  } catch (error) {
    return failure(error);
  }
}
