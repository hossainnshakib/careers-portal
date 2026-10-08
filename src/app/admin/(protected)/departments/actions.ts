"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { AdminAccessError, requireAdmin } from "@/lib/auth/requireAdmin";
import { departmentInput, reorderInput } from "@/lib/validation/departments";
import { departmentJobSlugs, reorderDepartment, saveDepartment } from "@/db/queries/departments";
import type { ActionResult } from "@/lib/actions/result";

async function invalidate(id: string) {
  revalidateTag("departments");
  revalidateTag("jobs");
  for (const { slug } of await departmentJobSlugs(id)) revalidateTag(`job:${slug}`);
  revalidatePath("/admin/departments");
}

export async function saveDepartmentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = departmentInput.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: "Check the department name, slug and active status." };
    const row = await saveDepartment(parsed.data);
    await invalidate(row.id);
    return { ok: true, data: row };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AdminAccessError
          ? "Administrator access required."
          : "Unable to save department. Check that the slug is unique and try again.",
    };
  }
}

export async function reorderDepartmentAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = reorderInput.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid reorder request." };
    await reorderDepartment(parsed.data.id, parsed.data.direction);
    await invalidate(parsed.data.id);
    return { ok: true, data: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AdminAccessError
          ? "Administrator access required."
          : "Unable to reorder departments. Try again.",
    };
  }
}
