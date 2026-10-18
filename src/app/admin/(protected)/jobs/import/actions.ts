"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin, AdminAccessError } from "@/lib/auth/requireAdmin";
import { loadImportCatalog } from "@/db/queries/job-import";
import { saveJob } from "@/db/queries/jobs";
import { mapImportJob, parseImport, previewImport, type ImportPreviewRow } from "@/lib/jobs/import";
import type { ActionResult } from "@/lib/actions/result";

function denied(error: unknown) {
  return { ok: false, error: error instanceof AdminAccessError
    ? "Administrator access required." : "Import unavailable. No existing jobs were changed. Retry preview before continuing." } as const;
}

export async function previewJobImportAction(text: unknown): Promise<ActionResult<ImportPreviewRow[]>> {
  try {
    await requireAdmin();
    if (typeof text !== "string") return { ok: false, error: "Choose a JSON file." };
    let parsed;
    try { parsed = parseImport(text); } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Invalid import file." };
    }
    return { ok: true, data: previewImport(parsed.jobs, await loadImportCatalog()) };
  } catch (error) { return denied(error); }
}

/** One atomic job per request keeps a slow bulk operation within existing route budgets.
 * A lost acknowledgement is safely retried: the shared job lock rechecks slug/title.
 */
export async function importJobAction(request: unknown): Promise<ActionResult<{ outcome: "created" | "skipped"; slug: string; warning?: string }>> {
  try {
    await requireAdmin();
    const parsed = z.strictObject({ text: z.string(), index: z.number().int().nonnegative(), confirmed: z.literal(true) }).safeParse(request);
    if (!parsed.success) return { ok: false, error: "Explicit import confirmation is required." };
    let file;
    try { file = parseImport(parsed.data.text); } catch {
      return { ok: false, error: "Invalid import file. Preview it again." };
    }
    const catalog = await loadImportCatalog();
    const preview = previewImport(file.jobs, catalog);
    if (preview.some((row) => row.outcome === "error"))
      return { ok: false, error: "Fix all file errors and preview again before importing." };
    const row = preview[parsed.data.index];
    if (!row) return { ok: false, error: "Invalid job selection." };
    if (row.outcome === "skip") return { ok: true, data: { outcome: "skipped", slug: row.slug } };
    const saved = await saveJob(mapImportJob(file.jobs[parsed.data.index], catalog), "skip-existing");
    if (!saved) return { ok: true, data: { outcome: "skipped", slug: row.slug } };
    try {
      for (const tag of ["jobs", "brands", "departments", `job:${saved.slug}`]) revalidateTag(tag);
      revalidatePath("/admin/jobs");
    } catch {
      // Persistence succeeded. Do not falsely report a rollback after invalidation fails.
      return { ok: true, data: { outcome: "created", slug: saved.slug,
        warning: "Saved, but public cache refresh failed. Allow five minutes and verify the job page." } };
    }
    return { ok: true, data: { outcome: "created", slug: saved.slug } };
  } catch (error) { return denied(error); }
}
