"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { AdminAccessError, requireAdmin } from "@/lib/auth/requireAdmin";
import { optionDelete, optionInput, optionReorder } from "@/lib/validation/options";
import { deleteOption, reorderOption, saveOption } from "@/db/queries/job-options";
import type { ActionResult } from "@/lib/actions/result";

function invalidate() {
  revalidateTag("jobs");
  revalidatePath("/admin/options");
  revalidatePath("/admin/jobs");
}

function failure(error: unknown, fallback: string) {
  return {
    ok: false,
    error:
      error instanceof AdminAccessError
        ? "Administrator access required."
        : /duplicate key|unique/i.test(String(error))
          ? "That slug already exists in this group. Use a different slug."
          : fallback,
  } as const;
}

export async function saveOptionAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = optionInput.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: "Check the option label, slug and active status." };
    const row = await saveOption(parsed.data);
    invalidate();
    return { ok: true, data: row };
  } catch (error) {
    return failure(error, "Unable to save option. Try again.");
  }
}

export async function reorderOptionAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = optionReorder.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid reorder request." };
    await reorderOption(parsed.data.id, parsed.data.direction);
    invalidate();
    return { ok: true, data: null };
  } catch (error) {
    return failure(error, "Unable to reorder options. Try again.");
  }
}

export async function deleteOptionAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = optionDelete.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid option request." };
    await deleteOption(parsed.data.id);
    invalidate();
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof AdminAccessError) return { ok: false, error: "Administrator access required." };
    if (String(error).includes("used by jobs"))
      return { ok: false, error: "This option belongs to jobs. Deactivate it instead of deleting it." };
    return { ok: false, error: "Unable to delete option. Try again." };
  }
}
